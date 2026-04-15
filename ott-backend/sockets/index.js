const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const registerUserHandlers = require("./handlers/user.socket");
const registerMessageHandlers = require("./handlers/message.socket");

const {
  addUserSocket,
  removeUserSocket
} = require("./presence");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://127.0.0.1:5500",
        "http://localhost:3001"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  /**
   * 🔐 AUTH MIDDLEWARE
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const sessionId = socket.handshake.auth?.sessionId;


      if (!token) {
        return next(new Error("No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 🔥 attach gọn
      socket.userId = decoded.userId;
      socket.user = decoded;

      socket.sessionId = sessionId;

      next();
    } catch (err) {
      console.log("❌ Socket auth error:", err.message);
      return next(new Error("Unauthorized"));
    }
  });

  /**
   * 🔌 CONNECTION
   */
  io.on("connection", (socket) => {
    const userId = socket.userId;

    console.log("🟢 Connected:", userId, "| socket:", socket.id);

    /**
     * 🔥 PRESENCE: add socket
     */
    const isFirst = addUserSocket(userId, socket.id);

    if (isFirst) {
      io.emit("user:online", { userId });
    }

    /**
     * 🔥 REGISTER EVENTS
     */
    registerUserHandlers(io, socket);
    registerMessageHandlers(io, socket);

    socket.on("disconnecting", () => {
      console.log("⚠️ Disconnecting:", userId, socket.id);
    });

    /**
     * 🔌 DISCONNECT
     */
    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", userId, "| reason:", reason);

      const isOffline = removeUserSocket(userId, socket.id);

      if (isOffline) {
        io.emit("user:offline", { userId });
      }
    });
  });

  return io;
};

module.exports = { initSocket };