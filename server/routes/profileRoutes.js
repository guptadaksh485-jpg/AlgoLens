const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/profile
router.get("/", protect, async (req, res) => {
  res.json(req.user);
});

// @route   PUT /api/profile
router.put("/", protect, async (req, res) => {
  try {
    const { name, handle, targetRating, darkMode } = req.body;
    const user = await User.findById(req.user._id);

    if (name !== undefined) user.name = name;
    if (handle !== undefined) user.handle = handle;
    if (targetRating !== undefined) user.targetRating = targetRating;
    if (darkMode !== undefined) user.darkMode = darkMode;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      currentRating: user.currentRating,
      targetRating: user.targetRating,
      darkMode: user.darkMode,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
