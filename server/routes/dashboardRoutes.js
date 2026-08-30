const express = require("express");
const Contest = require("../models/Contest");
const { protect } = require("../middleware/authMiddleware");
const { calculateStreak, buildWeeklyActivity } = require("../utils/streakCalculator");
const { getTopicWiseStats, getSolvedProblems } = require("../utils/codeforcesAnalytics");

const router = express.Router();

// @route   GET /api/dashboard
router.get("/", protect, async (req, res) => {
  try {
    const contests = await Contest.find({ user: req.user._id }).sort({ date: 1 });
    const [topicWise, solvedProblems] = await Promise.all([
      getTopicWiseStats(req.user._id),
      getSolvedProblems(req.user._id),
    ]);

    const highestRating = contests.length
      ? Math.max(...contests.map((c) => c.ratingAfter))
      : req.user.currentRating;

    const ratingProgress = contests.map((c) => ({
      date: c.date,
      contest: c.name,
      rating: c.ratingAfter,
    }));

    const topicDistribution = topicWise.map((t) => ({
      topic: t.tag,
      solved: t.solved,
      attempted: t.attempted,
    }));

    const weeklyActivity = buildWeeklyActivity(req.user.activityDates);
    const currentStreak = calculateStreak(req.user.activityDates);

    res.json({
      stats: {
        totalProblemsSolved: solvedProblems.length,
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
