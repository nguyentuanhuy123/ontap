const jwt = require("jsonwebtoken");
const { getUserById, hardDeleteUser } = require("../models/userModel");
const { deleteAllSessions, getSessionsByUserId } = require("../models/sessionModel");

const verifyAccessToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 MUST HAVE sessionId
    if (!decoded.sessionId) {
      return res.status(401).json({ message: "Invalid token (no session)" });
    }

    const sessions = await getSessionsByUserId(decoded.userId);

    const valid = sessions.some(
      (s) =>
        s.sessionId === decoded.sessionId &&
        s.refreshTokenHash // đảm bảo session chưa bị logout
    );

    if (!valid) {
      return res.status(401).json({ message: "Session invalid" });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ❌ DISABLED
    if (user.status === "disabled") {
      return res.status(403).json({ message: "Account disabled" });
    }

    // ⚠️ PENDING DELETE
    if (user.status === "pending_delete") {
      const now = Date.now();

      if (user.deleteAt && now > user.deleteAt) {
        await deleteAllSessions(user.userId);
        await hardDeleteUser(user.userId);

        return res.status(410).json({
          message: "Account permanently deleted"
        });
      }

      return res.status(403).json({
        message: "Account scheduled for deletion",
        deleteAt: user.deleteAt
      });
    }

    // ✅ OK
    req.user = {
      userId: user.userId,
      role: user.role,
      sessionId: decoded.sessionId // 🔥 QUAN TRỌNG
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

module.exports = {
  verifyAccessToken,
  authorize
};