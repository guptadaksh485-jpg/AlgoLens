const express = require("express");
const User = require("../models/User");
const Submission = require("../models/Submission");
const Contest = require("../models/Contest");
const { protect } = require("../middleware/authMiddleware");
const { deleteCached } = require("../utils/cache");

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

    const handleChanged = handle !== undefined && handle.trim() !== user.handle;

    if (name !== undefined) user.name = name;
    if (handle !== undefined) user.handle = handle;
    if (targetRating !== undefined) user.targetRating = targetRating;
    if (darkMode !== undefined) user.darkMode = darkMode;

    // Submissions/contests are only scoped by user, not by handle, so
    // switching handles without clearing the old ones would mix two
    // different Codeforces accounts' data together.
    if (handleChanged) {
      await Submission.deleteMany({ user: user._id });
      await Contest.deleteMany({ user: user._id, cfContestId: { $ne: null } });
      await deleteCached(`cf-analytics:${user._id}`);
      user.cfLastSyncedAt = null;
      user.activityDates = [];
      user.currentRating = 0;
    }

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
