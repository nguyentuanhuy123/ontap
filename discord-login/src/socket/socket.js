import { io } from "socket.io-client";
import { logout } from "../services/auth";

let socket;

export const connectSocket = (accessToken) => {
  const sessionId = localStorage.getItem("sessionId");

  if (!accessToken || !sessionId) return null;

  if (!socket) {
    socket = io("http://localhost:3000", {
      auth: {
        token: accessToken,
        sessionId
      },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      autoConnect: true
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket error:", err.message);
    });

    socket.on("forceLogout", async (data) => {
      alert(data.message || "Bạn đã bị đăng xuất");

      await logout();
      disconnectSocket();

      window.location.href = "/";
    });

  } else {
    socket.auth = {
      token: accessToken,
      sessionId
    };

    if (socket.connected) {
      socket.disconnect();
    }

    socket.connect();
  }

  return socket;
};

/**
 * 🔥 LẤY SOCKET HIỆN TẠI
 */
export const getSocket = () => socket;

/**
 * 🔥 NGẮT SOCKET
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};