const express = require("express");
const Contest = require("../models/Contest");
const AIAnalysis = require("../models/AIAnalysis");
const { protect } = require("../middleware/authMiddleware");
const {
  callGeminiForJson,
  buildProgressAnalysisPrompt,
  buildWeeklyPlanPrompt,
  buildRecommendationsPrompt,
} = require("../utils/gemini");
const { getTopicWiseStats } = require("../utils/codeforcesAnalytics");
const { pickCandidates } = require("../utils/problemRecommender");
const { getCached, setCached } = require("../utils/cache");

const router = express.Router();

// @route   POST /api/ai/analyze
router.post("/analyze", protect, async (req, res) => {
  try {
    const contests = await Contest.find({ user: req.user._id }).sort({ date: 1 });
    const topicWise = await getTopicWiseStats(req.user._id);

    if (contests.length === 0) {
      return res.status(400).json({ message: "Add at least one contest before analyzing progress" });
    }

    const topics = topicWise.map((t) => ({ name: t.tag, solved: t.solved, attempted: t.attempted }));
    const prompt = buildProgressAnalysisPrompt({ user: req.user, contests, topics });
    const parsed = await callGeminiForJson(prompt);

    const saved = await AIAnalysis.create({
      user: req.user._id,
      type: "progress",
      content: parsed,
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/ai/plan
router.post("/plan", protect, async (req, res) => {
  try {
    const { hoursPerDay } = req.body;
    const targetRating = req.body.targetRating || req.user.targetRating;

    if (!hoursPerDay) {
      return res.status(400).json({ message: "hoursPerDay is required" });
    }

    const topicWise = await getTopicWiseStats(req.user._id);
    const weakestTopics = [...topicWise]
      .sort((a, b) => a.solved - b.solved)
      .slice(0, 3)
      .map((t) => t.tag);

    const prompt = buildWeeklyPlanPrompt({
      targetRating,
      hoursPerDay,
      currentRating: req.user.currentRating,
      weakestTopics,
    });
    const parsed = await callGeminiForJson(prompt);

    const saved = await AIAnalysis.create({
      user: req.user._id,
      type: "plan",
      content: { ...parsed, targetRating, hoursPerDay },
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/ai/recommendations
router.post("/recommendations", protect, async (req, res) => {
  if (!req.user.handle) {
    return res.status(400).json({ message: "Set your Codeforces handle in Profile and sync first" });
  }

  try {
    const topicStats = await getTopicWiseStats(req.user._id);
    if (topicStats.length === 0) {
      return res.status(400).json({ message: "Sync your Codeforces submissions first" });
    }

    const weakTopics = [...topicStats].sort((a, b) => a.solved - b.solved).slice(0, 3).map((t) => t.tag);
    const candidates = await pickCandidates(req.user._id, weakTopics, req.user.currentRating);

    if (candidates.length === 0) {
      return res.status(400).json({ message: "No matching unsolved problems found right now" });
    }

    // Cache briefly so repeated clicks don't burn API quota for the same answer.
    const cacheKey = `recommendations:${req.user._id}:${weakTopics.join(",")}:${req.user.currentRating}`;
    let parsed = await getCached(cacheKey);

    if (!parsed) {
      const prompt = buildRecommendationsPrompt({
        weakTopics,
        currentRating: req.user.currentRating,
        targetRating: req.user.targetRating,
        candidates,
      });
      parsed = await callGeminiForJson(prompt);
      await setCached(cacheKey, parsed, 60 * 30);
    }

    const saved = await AIAnalysis.create({
      user: req.user._id,
      type: "recommendations",
      content: parsed,
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/ai/history?type=progress|plan|recommendations
router.get("/history", protect, async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.type) filter.type = req.query.type;

    const history = await AIAnalysis.find(filter).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
