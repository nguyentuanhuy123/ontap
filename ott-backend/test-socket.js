const axios = require("axios");
const { io } = require("socket.io-client");
let socket;

const connectSocket = async () => {
  const res = await axios.post("http://127.0.0.1:3000/api/auth/login", {
    email: "test@example.com",
    password: "newpass123"
  });

  const accessToken = res.data.accessToken;

  socket = io("http://127.0.0.1:3000", {
    auth: { token: accessToken }
  });

  socket.on("connect", () => {
    console.log("🟢 Connected");
  });

  socket.on("connect_error", async (err) => {
    if (err.message === "Unauthorized") {
      console.log("🔄 Token expired → reconnecting...");
      socket.disconnect();
      connectSocket(); // login lại
    }
  });
};

connectSocket();