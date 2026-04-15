const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { initSocket } = require("./sockets");

dotenv.config();

const app = express();

/**
 * ✅ CORS CONFIG (QUAN TRỌNG)
 */
app.use(cors({
  origin: [
    "http://127.0.0.1:5500", // live server
    "http://localhost:3001", // frontend dev
    "http://127.0.0.1:3000"
  ],
  credentials: true
}));

app.use(express.json());

/**
 * ✅ ROUTES
 */
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

/**
 * ❗ HTTP SERVER
 */
const server = http.createServer(app);

/**
 * 🔥 SOCKET
 */
const io = initSocket(server);
app.set("io", io);

server.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});