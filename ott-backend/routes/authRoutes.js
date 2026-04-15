const express = require("express");
const { register, login, refresh, logout, forgotPassword, resetPassword, updateProfile, updateAvatar, ping, updatePhone, changePassword, verifyLoginOtp, disableMyAccount, restoreMyAccount, deleteMyAccount } = require("../controllers/authController");
const { verifyAccessToken } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5
});

// chống spam verify OTP
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

const r = express.Router();

r.post("/register", register);

r.post("/login", loginLimiter, login);
r.post("/login/verify-otp", otpLimiter, verifyLoginOtp);

r.post("/refresh", refresh);
r.post("/logout", verifyAccessToken, logout);
r.post("/forgot",forgotLimiter ,forgotPassword);
r.post("/reset", resetPassword);

r.put("/profile", verifyAccessToken, updateProfile);
r.put("/avatar", verifyAccessToken, upload.single("avatar"), updateAvatar);
r.put("/phone", verifyAccessToken, updatePhone);
r.put("/password", verifyAccessToken, changePassword);


r.post("/ping", verifyAccessToken, ping);

r.post("/account/disable", verifyAccessToken, disableMyAccount);
r.post("/account/restore", restoreMyAccount);
r.post("/account/delete", verifyAccessToken, deleteMyAccount);

module.exports = r;