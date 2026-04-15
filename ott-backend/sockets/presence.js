const { updateUser } = require("../models/userModel");

// userId -> Set(socketId)
const onlineUsers = new Map();

const addUserSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  const userSockets = onlineUsers.get(userId);
  userSockets.add(socketId);

  return userSockets.size === 1; // first connection
};

const removeUserSocket = (userId, socketId) => {
  const userSockets = onlineUsers.get(userId);
  if (!userSockets) return false;

  userSockets.delete(socketId);

  if (userSockets.size === 0) {
    onlineUsers.delete(userId);

    // ✅ CHỈ update lastSeen
    updateUser(userId, {
      lastSeen: Date.now()
    }).catch(console.error);

    return true;
  }

  return false;
};

const getUserSockets = (userId) => {
  return onlineUsers.get(userId);
};

// 🔥 check online kiểu Discord
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

module.exports = {
  addUserSocket,
  removeUserSocket,
  getUserSockets,
  isUserOnline
};