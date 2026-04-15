const { getUserSockets } = require("../presence");

module.exports = (io, socket) => {
  const fromUserId = socket.user.userId;

  // 📩 gửi message
  socket.on("message:send", ({ toUserId, message }) => {
    const targetSockets = getUserSockets(toUserId);

    if (targetSockets) {
      targetSockets.forEach((socketId) => {
        io.to(socketId).emit("message:receive", {
          from: fromUserId,
          message
        });
      });
    }
  });

  // ✍️ typing
  socket.on("typing", ({ toUserId }) => {
    const targetSockets = getUserSockets(toUserId);

    if (targetSockets) {
      targetSockets.forEach((socketId) => {
        io.to(socketId).emit("typing", {
          from: fromUserId
        });
      });
    }
  });
};