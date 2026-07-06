const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      currentRating: user.currentRating,
      targetRating: user.targetRating,
      darkMode: user.darkMode,
      token: generateToken(user._id),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      currentRating: user.currentRating,
      targetRating: user.targetRating,
      darkMode: user.darkMode,
      token: generateToken(user._id),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
