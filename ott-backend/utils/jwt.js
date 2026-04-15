const jwt = require("jsonwebtoken");

const generateAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      userId: user.userId,
      role: user.role,
      sessionId
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      role: user.role
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};