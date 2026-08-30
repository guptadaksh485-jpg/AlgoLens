const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { CodeforcesError } = require("../utils/codeforcesClient");
const { syncUserSubmissions } = require("../utils/codeforcesSync");
const { getTopicWiseStats, getDifficultyWiseStats } = require("../utils/codeforcesAnalytics");
const { getCached, setCached, deleteCached, allowOncePerWindow } = require("../utils/cache");

const router = express.Router();

const SYNC_COOLDOWN_SECONDS = 120;
const ANALYTICS_CACHE_SECONDS = 300;

// @route   POST /api/codeforces/sync
// Rate limited per user to keep the CF API and our DB from getting hammered.
router.post("/sync", protect, async (req, res) => {
  if (!req.user.handle) {
    return res.status(400).json({ message: "Set your Codeforces handle in Profile first" });
  }

  const canSync = await allowOncePerWindow(`cf-sync:${req.user._id}`, SYNC_COOLDOWN_SECONDS);
  if (!canSync) {
    return res.status(429).json({ message: "Already synced recently, try again in a minute or two" });
  }

  try {
    const result = await syncUserSubmissions(req.user._id, req.user.handle);

    const user = await User.findById(req.user._id);
    user.currentRating = result.cfRating;
    user.cfLastSyncedAt = new Date();
    user.activityDates = [...new Set([...user.activityDates, ...result.activityDates])];
    await user.save();

    // Clear the cached analytics now instead of waiting out the TTL.
    await deleteCached(`cf-analytics:${req.user._id}`);

    res.json({
      cfRating: result.cfRating,
      submissionsSeen: result.submissionsSeen,
      contestsSeen: result.contestsSeen,
      syncedAt: user.cfLastSyncedAt,
    });
  } catch (err) {
    if (err instanceof CodeforcesError) {
      const statusByCode = { INVALID_HANDLE: 404, RATE_LIMITED: 429 };
      return res.status(statusByCode[err.code] || 502).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/codeforces/analytics
router.get("/analytics", protect, async (req, res) => {
  const cacheKey = `cf-analytics:${req.user._id}`;
  const cached = await getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [topicWise, difficultyWise] = await Promise.all([
      getTopicWiseStats(req.user._id),
      getDifficultyWiseStats(req.user._id),
    ]);

    const analytics = { topicWise, difficultyWise, lastSyncedAt: req.user.cfLastSyncedAt };
    await setCached(cacheKey, analytics, ANALYTICS_CACHE_SECONDS);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
