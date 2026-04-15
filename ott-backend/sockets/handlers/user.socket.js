const { isUserOnline } = require("../presence");
const { getUserById } = require("../../models/userModel");

module.exports = (io, socket) => {
  const userId = socket.user.userId;

  // 🫀 heartbeat
  socket.on("ping", async () => {
    const { updateUser } = require("../../models/userModel");

    await updateUser(userId, {
      lastSeen: Date.now()
    });
  });

  // 📡 check trạng thái user khác
  socket.on("user:get_status", async ({ targetUserId }) => {
    const isOnline = isUserOnline(targetUserId);

    let lastSeen = null;

    if (!isOnline) {
      const user = await getUserById(targetUserId);
      lastSeen = user?.lastSeen || null;
    }

    socket.emit("user:status", {
      userId: targetUserId,
      isOnline,
      lastSeen
    });
  });
};