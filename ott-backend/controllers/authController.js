const { v4: uuid } = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createOtp } = require("../models/otpModel");


const { getUserSockets } = require("../sockets/presence");


const { ddbDocClient } = require("../config/awsConfig");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");

const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/awsConfig");
const { uploadToS3 } = require("../middleware/upload");

const transporter = require("../config/mailer");
const { resetPasswordTemplate ,otpEmailTemplate} = require("../utils/emailTemplate");

const {
  createSession,
  deleteSession,
  deleteAllSessions,
  deleteOldestSession,
  getSessionsByUserId,
  updateSession
} = require("../models/sessionModel");

const {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  setResetToken,
  verifyResetToken,
  clearResetToken,
  getUserByUsername,
  disableAccount,
  restoreDisabledAccount,
  requestDeleteAccount,
  cancelDeleteAccount,
  restoreAccountState
} = require("../models/userModel");

const {
  generateAccessToken,
  generateRefreshToken
} = require("../utils/jwt");

const {
  getOtpsByUser,
  deleteOtp,
  increaseAttempts
} = require("../models/otpModel");

/**
 * =========================
 * HELPER RESPONSE
 * =========================
 */
const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message
  });
};

const sendSuccess = (res, data = {}, message = "OK") => {
  return res.json({
    success: true,
    message,
    ...data
  });
};

/**
 * =========================
 * VALIDATION
 * =========================
 */
const isValidUsername = (username) => {
  return /^[a-zA-Z0-9._]{3,20}$/.test(username);
};

const isStrongPassword = (password) => {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
};

/**
 * =========================
 * REGISTER
 * =========================
 */
const register = async (req, res) => {
  try {
    let { email, displayName, username, password, birthday } = req.body;

    if (!email || !displayName || !username || !password || !birthday) {
      return sendError(res, 400, "Missing required fields");
    }

    email = email.toLowerCase().trim();
    username = username.toLowerCase().trim();

    if (!isValidUsername(username)) {
      return sendError(res, 400, "Invalid username");
    }

    if (!isStrongPassword(password)) {
      return sendError(res, 400, "Weak password");
    }

    const existEmail = await getUserByEmail(email);
    if (existEmail) return sendError(res, 409, "Email already exists");

    const existUsername = await getUserByUsername(username);
    if (existUsername) return sendError(res, 409, "Username taken");

    const hash = await bcrypt.hash(password, 10);

    await createUser({
      userId: uuid(),
      email,
      displayName,
      username,
      password: hash,
      birthday,
      role: "user",
      status: "active",
      lastSeen: null,
      disabledAt: null,
      deletionRequestedAt: null,
      deleteAt: null,
      deletedAt: null
    });

    return sendSuccess(res, { username }, "Registered");
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};

/**
 * =========================
 * LOGIN (MULTI SESSION)
 * =========================
 */
const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, "Missing credentials");
    }

    email = email.toLowerCase().trim();

    let user = await getUserByEmail(email);
    if (!user) return sendError(res, 401, "Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 401, "Invalid credentials");

    if (user.status === "banned") {
      return sendError(res, 403, "Account banned");
    }

    if (user.status === "disabled") {
      return sendError(res, 403, "Account disabled");
    }
    
    if (user.status === "pending_delete") {
      return sendError(res, 403, "Account scheduled for deletion");
    }

    const sessions = await getSessionsByUserId(user.userId);
    const sessionIdFromClient = req.headers["x-session-id"];
    const sessionId = sessionIdFromClient || uuid();
    const isTrustedDevice = sessionIdFromClient &&
      sessions.some(
        (s) => s.sessionId === sessionIdFromClient && s.trusted === true
      );

    // =========================
    // ✅ TRUSTED → LOGIN LUÔN
    // =========================
    if (isTrustedDevice) {
      const sessionId = sessionIdFromClient || uuid();
      const accessToken = generateAccessToken(user, sessionId);
      const refreshToken = generateRefreshToken(user);
      const hash = await bcrypt.hash(refreshToken, 10);

      
      if (sessions.length >= 5) {
        await deleteOldestSession(user.userId);
      }

      await createSession({
        sessionId,
        userId: user.userId,
        refreshTokenHash: hash,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        trusted: true,
        createdAt: new Date().toISOString(),
        expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      });

      const { password, ...safeUser } = user;

      return sendSuccess(res, {
        accessToken,
        refreshToken,
        sessionId,
        user: safeUser
      }, "Login successful (trusted device)");
    }

    // =========================
    // ❗ DEVICE LẠ → GỬI OTP
    // =========================

    // 🔥 xoá OTP cũ
    const oldOtps = await getOtpsByUser(user.userId, "login");
    await Promise.all(oldOtps.map((o) => deleteOtp(o.otpId)));

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await createOtp({
      otpId: uuid(),
      userId: user.userId,
      otpHash,
      type: "login",
      attempts: 0,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      createdAt: new Date().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + 5 * 60
    });

    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your login OTP",
      html: otpEmailTemplate(otp)
    });

    return sendSuccess(res, {
      requireOtp: true,
      userId: user.userId
    }, "OTP sent");

  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};


const verifyLoginOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return sendError(res, 400, "Missing fields");
    }

    const user = await getUserById(userId);
    if (!user) return sendError(res, 404, "User not found");

    const otps = await getOtpsByUser(userId, "login");

    if (!otps.length) {
      return sendError(res, 400, "OTP not found");
    }

    // 🔥 lấy OTP mới nhất
    otps.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latestOtp = otps[0];

    // 🔥 check expire
    if (latestOtp.expiresAt < Math.floor(Date.now() / 1000)) {
      await deleteOtp(latestOtp.otpId);
      return sendError(res, 400, "OTP expired");
    }

    // 🔥 check brute force trước
    if (latestOtp.attempts >= 5) {
      await deleteOtp(latestOtp.otpId);
      return sendError(res, 429, "Too many attempts");
    }

    const match = await bcrypt.compare(otp, latestOtp.otpHash);

    if (!match) {
      await increaseAttempts(latestOtp.otpId);
      return sendError(res, 401, "Invalid OTP");
    }

    // 🔥 delete OTP sau khi dùng
    await deleteOtp(latestOtp.otpId);

    // 🔥 LOGIN REAL
    const sessionIdFromClient = req.headers["x-session-id"];

    const sessionId = sessionIdFromClient || uuid();
    const accessToken = generateAccessToken(user, sessionId);
    const refreshToken = generateRefreshToken(user);
    const hash = await bcrypt.hash(refreshToken, 10);


    const sessions = await getSessionsByUserId(user.userId);
    if (sessions.length >= 5) {
      await deleteOldestSession(user.userId);
    }

    await createSession({
      sessionId,
      userId: user.userId,
      refreshTokenHash: hash,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      trusted: true, // 🔥 đánh dấu trusted
      createdAt: new Date().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    });

    const { password, ...safeUser } = user;

    return sendSuccess(res, {
      accessToken,
      refreshToken,
      sessionId,
      user: safeUser
    }, "Login successful");

  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};

/**
 * =========================
 * REFRESH TOKEN
 * =========================
 */
const refresh = async (req, res) => {
  try {
    const token = req.body.refreshToken;
    if (!token) return sendError(res, 401, "No token");

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const sessions = await getSessionsByUserId(decoded.userId);

    let validSession = null;

    for (const s of sessions) {
      const match = await bcrypt.compare(token, s.refreshTokenHash);
      if (match) {
        validSession = s;
        break;
      }
    }

    if (!validSession) {
      return sendError(res, 403, "Invalid token");
    }

    const user = await getUserById(decoded.userId);

    // rotate token
    const newRefreshToken = generateRefreshToken(user);
    const newAccessToken = generateAccessToken(user, validSession.sessionId);
    const newHash = await bcrypt.hash(newRefreshToken, 10);

    await updateSession(validSession.sessionId, {
      refreshTokenHash: newHash,
      expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    });

    return sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: validSession.sessionId
    });

  } catch (err) {
    return sendError(res, 403, "Token invalid");
  }
};

/**
 * =========================
 * LOGOUT (1 DEVICE)
 * =========================
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 400, "Token required");

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const sessions = await getSessionsByUserId(decoded.userId);

    for (const s of sessions) {
      const match = await bcrypt.compare(refreshToken, s.refreshTokenHash);
      if (match) {
        await updateSession(s.sessionId, {
          refreshTokenHash: null
        });

        break;
      }
    }

    return sendSuccess(res, {}, "Logged out");

  } catch (err) {
    return sendError(res, 400, "Logout failed");
  }
};

/**
 * =========================
 * FORGOT PASSWORD
 * =========================
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return sendError(res, 400, "Email required");

    const user = await getUserByEmail(email.toLowerCase());
    if (!user) return sendSuccess(res, {}, "If exists, email sent");

    const token = uuid();
    await setResetToken(user.userId, token);

    const link = `${process.env.CLIENT_URL}/reset?uid=${user.userId}&token=${token}`;

    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset password",
      html: resetPasswordTemplate(link)
    });

    return sendSuccess(res, {}, "Check email");

  } catch (err) {
    return sendError(res, 500, "Email failed");
  }
};

/**
 * =========================
 * RESET PASSWORD
 * =========================
 */
const resetPassword = async (req, res) => {
  try {
    // 1. Nhận sessionId thay vì currentRefreshToken
    const { userId, token, newPassword, sessionId } = req.body;

    if (!userId || !token || !newPassword) {
      return sendError(res, 400, "Missing fields");
    }

    if (!isStrongPassword(newPassword)) {
      return sendError(res, 400, "Weak password");
    }

    // 2. Xác thực reset token từ email
    const user = await verifyResetToken(userId, token);
    if (!user) return sendError(res, 400, "Invalid or expired token");

    // 3. Cập nhật mật khẩu mới
    const hash = await bcrypt.hash(newPassword, 10);
    await updateUser(user.userId, { password: hash });

    // 4. Xử lý Session trong Database
    const sessions = await getSessionsByUserId(user.userId);
    
    // Tạo token mới để trả về cho người dùng (vì pass đã đổi, token cũ nên bỏ)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);

    let currentSessionExists = false;

    for (const s of sessions) {
      // Nếu là session hiện tại đang thao tác
      if (sessionId && s.sessionId === sessionId) {
        currentSessionExists = true;
        // Cập nhật lại hash mới cho session này
        await updateSession(s.sessionId, { refreshTokenHash: newRefreshHash });
      } else {
        // Xóa tất cả các session khác
        await deleteSession(s.sessionId);
      }
    }

    // Nếu không tìm thấy session hiện tại (có thể là tab ẩn danh hoặc trình duyệt khác)
    // thì tạo một session mới hoàn toàn
    if (!currentSessionExists) {
      await createSession({
        sessionId: sessionId || uuid(),
        userId: user.userId,
        refreshTokenHash: newRefreshHash,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        createdAt: new Date().toISOString(),
        expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        trusted: true
      });
    }

    // 5. Xử lý Socket (Đuổi các thiết bị khác)
    const io = req.app.get("io");
    const sockets = getUserSockets(user.userId);

    sockets?.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      
      // 🔥 CHỈ logout những socket có sessionId KHÁC với sessionId hiện tại
      // (Lưu ý: Bạn phải gán socket.sessionId trong middleware initSocket như đã làm trước đó)
      if (socket && socket.sessionId !== sessionId) {
        socket.emit("forceLogout", { 
          message: "Mật khẩu đã được đặt lại, thiết bị này đã bị đăng xuất." 
        });
        socket.disconnect(true);
      }
    });

    // 6. Xóa reset token sau khi dùng xong
    await clearResetToken(user.userId);

    // Trả về token mới để FE cập nhật lại quyền truy cập
    return sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }, "Password reset successfully, other devices logged out");

  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};

/**
 * =========================
 * UPDATE PROFILE
 * =========================
 */
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { displayName, birthday} = req.body;

    const data = {};

    if (displayName) data.displayName = displayName;
    if (birthday) data.birthday = birthday;
    


    if (!Object.keys(data).length) {
      return sendError(res, 400, "Nothing to update");
    }

    await updateUser(userId, data);

    const user = await getUserById(userId);
    const { password, ...safeUser } = user;

    return sendSuccess(res, { user: safeUser });

  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};

/**
 * =========================
 * UPDATE AVATAR
 * =========================
 */
const updateAvatar = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!req.file) {
      return sendError(res, 400, "File required");
    }

    const user = await getUserById(userId);

    if (user.avatar) {
      try {
        const oldKey = user.avatar.split(".amazonaws.com/")[1];
        if (oldKey) {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: oldKey
          }));
        }
      } catch {}
    }

    const url = await uploadToS3(req.file);

    await updateUser(userId, { avatar: url });

    const updated = await getUserById(userId);
    const { password, ...safeUser } = updated;

    return sendSuccess(res, { user: safeUser });

  } catch (err) {
    return sendError(res, 500, "Upload failed");
  }
};

/**
 * =========================
 * PING
 * =========================
 */
const ping = async (req, res) => {
  try {
    const { userId } = req.user;

    await updateUser(userId, {
      lastSeen: Date.now()
    });

    return res.sendStatus(200);
  } catch {
    return res.sendStatus(500);
  }
};

/**
 * =========================
 * GET PROFILE
 * =========================
 */
const getProfile = async (req, res) => {
  try {
    const { userId } = req.user; // userId đã được decode từ middleware auth

    const user = await getUserById(userId);
    if (!user) return sendError(res, 404, "User not found");

    const { password, ...safeUser } = user; // loại bỏ password
    return sendSuccess(res, { user: safeUser });

  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};

/**
 * =========================
 * UPDATE PHONE
 * =========================
 */
/**
 * =========================
 * UPDATE PHONE (CHECK DUPLICATE)
 * =========================
 */
const updatePhone = async (req, res) => {
  try {
    const { userId } = req.user;
    const { phone, password } = req.body;

    if (!phone || !password) {
      return sendError(res, 400, "Phone and password required");
    }

    // validate phone cơ bản
    if (!/^\+?\d{7,15}$/.test(phone)) {
      return sendError(res, 400, "Invalid phone number");
    }

    // Lấy user hiện tại
    const user = await getUserById(userId);
    if (!user) return sendError(res, 404, "User not found");

    // kiểm tra mật khẩu
    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 401, "Incorrect password");

    // kiểm tra số điện thoại đã tồn tại
    const existingUsers = await ddbDocClient.send(
      new QueryCommand({
        TableName: "Users",
        IndexName: "phone-index", // cần tạo GSI phone-index nếu chưa có
        KeyConditionExpression: "phone = :p",
        ExpressionAttributeValues: { ":p": phone },
        Limit: 1
      })
    );

    if (existingUsers.Items?.[0] && existingUsers.Items[0].userId !== userId) {
      return sendError(res, 409, "Phone number already in use");
    }

    // cập nhật số điện thoại
    await updateUser(userId, { phone });

    const updated = await getUserById(userId);
    const { password: _, ...safeUser } = updated;

    return sendSuccess(res, { user: safeUser }, "Phone updated successfully");

  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};

const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword, sessionId } = req.body;

    if (!currentPassword || !newPassword || !sessionId) {
      return sendError(res, 400, "Missing fields");
    }

    if (!isStrongPassword(newPassword)) {
      return sendError(res, 400, "Weak password");
    }

    const user = await getUserById(userId);
    if (!user) return sendError(res, 404, "User not found");

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return sendError(res, 401, "Incorrect current password");

    // 🔥 update password
    const hash = await bcrypt.hash(newPassword, 10);
    await updateUser(userId, { password: hash });

    const sessions = await getSessionsByUserId(userId);

    // 🔥 logout socket tất cả
    const io = req.app.get("io");
    const sockets = getUserSockets(userId);

    sockets?.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      
      // 🔥 CHỈ logout những socket có sessionId KHÁC với sessionId hiện tại
      if (socket && socket.sessionId !== sessionId) { 
        socket.emit("forceLogout", {
          message: "Mật khẩu đã thay đổi, thiết bị này đã bị đăng xuất."
        });
        socket.disconnect(true);
      }
    });

    // 🔥 giữ lại session hiện tại
    for (const s of sessions) {
      if (s.sessionId !== sessionId) {
        await deleteSession(s.sessionId);
      }
    }

    return sendSuccess(res, {}, "Password updated and other devices logged out");

  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};

const disableMyAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { password } = req.body;

    if (!password) return sendError(res, 400, "Password required");

    const user = await getUserById(userId);
    if (!user) return sendError(res, 404, "User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 401, "Incorrect password");

    if (user.status === "disabled") {
      return sendError(res, 409, "Account already disabled");
    }

    await disableAccount(userId);

    const sessions = await getSessionsByUserId(userId);
    await Promise.all(sessions.map((s) => deleteSession(s.sessionId)));

    const io = req.app.get("io");
    const sockets = getUserSockets(userId);
    sockets?.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit("forceLogout", {
          message: "Tài khoản đã bị vô hiệu hóa."
        });
        socket.disconnect(true);
      }
    });

    return sendSuccess(res, {}, "Account disabled");
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};

const restoreMyAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, "Missing fields");
    }

    let user = await getUserByEmail(email.toLowerCase());
    if (!user) return sendError(res, 404, "User not found");

    // Nếu pending_delete mà đã quá hạn thì xóa hẳn, không cho restore
    if (user.status === "pending_delete") {
      const now = Date.now();

      if (user.deleteAt && now > user.deleteAt) {
        await deleteAllSessions(user.userId);
        await hardDeleteUser(user.userId);
        return sendError(res, 410, "Account permanently deleted");
      }
    }

    // Chỉ cho restore khi đang disabled hoặc pending_delete chưa hết hạn
    if (user.status !== "disabled" && user.status !== "pending_delete") {
      return sendError(res, 400, "Account is already active");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 401, "Incorrect password");

    await restoreAccountState(user.userId);

    user = await getUserById(user.userId);

    const sessionId = uuid();
    const accessToken = generateAccessToken(user, sessionId);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await createSession({
      sessionId,
      userId: user.userId,
      refreshTokenHash,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      trusted: true,
      createdAt: new Date().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    });

    const { password: _, ...safeUser } = user;

    return sendSuccess(res, {
      accessToken,
      refreshToken,
      sessionId,
      user: safeUser
    }, "Account restored");
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};

const deleteMyAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { password } = req.body;

    if (!password) return sendError(res, 400, "Password required");

    const user = await getUserById(userId);
    if (!user) return sendError(res, 404, "User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 401, "Incorrect password");

    await requestDeleteAccount(userId);

    await deleteAllSessions(userId);

    const io = req.app.get("io");
    const sockets = getUserSockets(userId);
    sockets?.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit("forceLogout", {
          message: "Tài khoản đang chờ xóa trong 15 ngày."
        });
        socket.disconnect(true);
      }
    });

    return sendSuccess(res, {
      deleteAt: Date.now() + 15 * 24 * 60 * 60 * 1000
    }, "Account scheduled for deletion");
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};



module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  updateProfile,
  updateAvatar,
  ping,
  getProfile,
  updatePhone,
  changePassword,
  verifyLoginOtp,
  disableMyAccount,
  restoreMyAccount,
  deleteMyAccount
};