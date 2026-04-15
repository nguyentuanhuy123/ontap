const express = require("express");
const { verifyAccessToken, authorize } = require("../middleware/auth");
const { getProfile } = require("../controllers/authController");

const r = express.Router();


r.get("/me", verifyAccessToken, getProfile);

// Route admin demo
r.get("/admin", verifyAccessToken, authorize("admin"), (req, res) => {
  res.json({ message: "Admin only" });
});

module.exports = r;