const express = require("express");
const Contest = require("../models/Contest");
const Topic = require("../models/Topic");
const AIAnalysis = require("../models/AIAnalysis");
const { protect } = require("../middleware/authMiddleware");
const {
  callGemini,
  parseJsonResponse,
  buildProgressAnalysisPrompt,
  buildWeeklyPlanPrompt,
  buildRecommendationsPrompt,
} = require("../utils/gemini");

const router = express.Router();

// @route   POST /api/ai/analyze
// "Analyze My Progress" - looks at rating history, contest history and
// topic stats, and returns strongest/weakest topics + trend + suggestions.
router.post("/analyze", protect, async (req, res) => {
  try {
    const contests = await Contest.find({ user: req.user._id }).sort({ date: 1 });
    const topics = await Topic.find({ user: req.user._id });

    if (contests.length === 0) {
      return res.status(400).json({ message: "Add at least one contest before analyzing progress" });
    }

    const prompt = buildProgressAnalysisPrompt({ user: req.user, contests, topics });
    const rawText = await callGemini(prompt);
    const parsed = parseJsonResponse(rawText);

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
// "Weekly Practice Plan" - input target rating + hours/day, output a 7-day plan.
router.post("/plan", protect, async (req, res) => {
  try {
    const { hoursPerDay } = req.body;
    const targetRating = req.body.targetRating || req.user.targetRating;

    if (!hoursPerDay) {
      return res.status(400).json({ message: "hoursPerDay is required" });
    }

    const topics = await Topic.find({ user: req.user._id });
    const weakestTopics = [...topics]
      .sort((a, b) => a.solved - b.solved)
      .slice(0, 3)
      .map((t) => t.name);

    const prompt = buildWeeklyPlanPrompt({
      targetRating,
      hoursPerDay,
      currentRating: req.user.currentRating,
      weakestTopics,
    });
    const rawText = await callGemini(prompt);
    const parsed = parseJsonResponse(rawText);

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
// "Problem Recommendations" - 5 problems targeted at the user's weak topics.
router.post("/recommendations", protect, async (req, res) => {
  try {
    const contests = await Contest.find({ user: req.user._id });
    const topics = await Topic.find({ user: req.user._id });

    const weakTopics = [...topics]
      .sort((a, b) => a.solved - b.solved)
      .slice(0, 3)
      .map((t) => t.name);

    const prompt = buildRecommendationsPrompt({
      weakTopics,
      currentRating: req.user.currentRating,
      targetRating: req.user.targetRating,
      contests,
    });
    const rawText = await callGemini(prompt);
    const parsed = parseJsonResponse(rawText);

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
