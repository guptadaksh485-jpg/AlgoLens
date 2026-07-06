const express = require("express");
const Contest = require("../models/Contest");
const Topic = require("../models/Topic");
const { protect } = require("../middleware/authMiddleware");
const { calculateStreak, buildWeeklyActivity } = require("../utils/streakCalculator");

const router = express.Router();

// @route   GET /api/dashboard
// Returns everything the dashboard page needs in a single request so the
// client doesn't have to fire off four separate calls on load.
router.get("/", protect, async (req, res) => {
  try {
    const contests = await Contest.find({ user: req.user._id }).sort({ date: 1 });
    const topics = await Topic.find({ user: req.user._id });

    const highestRating = contests.length
      ? Math.max(...contests.map((c) => c.ratingAfter))
      : req.user.currentRating;

    const totalProblemsSolved = topics.reduce((sum, t) => sum + t.solved, 0);

    const ratingProgress = contests.map((c) => ({
      date: c.date,
      contest: c.name,
      rating: c.ratingAfter,
    }));

    const topicDistribution = topics.map((t) => ({
      topic: t.name,
      solved: t.solved,
      attempted: t.attempted,
    }));

    const weeklyActivity = buildWeeklyActivity(req.user.activityDates);
    const currentStreak = calculateStreak(req.user.activityDates);

    res.json({
      stats: {
        totalProblemsSolved,
        currentRating: req.user.currentRating,
        highestRating,
        contestCount: contests.length,
        currentStreak,
      },
      charts: {
        ratingProgress,
        topicDistribution,
        weeklyActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
