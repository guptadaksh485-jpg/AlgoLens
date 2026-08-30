const express = require("express");
const Contest = require("../models/Contest");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { getTopicWiseStats } = require("../utils/codeforcesAnalytics");
const {
  callGeminiForJson,
  buildContestReviewPrompt,
} = require("../utils/gemini");

const router = express.Router();

// currentRating is authoritative from Codeforces sync once the user has
// synced at least once; manual contests only drive it before that.
const syncCurrentRating = async (userId) => {
  const user = await User.findById(userId);
  if (user.cfLastSyncedAt) return;

  const latest = await Contest.findOne({ user: userId }).sort({ date: -1 });
  user.currentRating = latest ? latest.ratingAfter : 0;
  await user.save();
};

// @route   GET /api/contests
router.get("/", protect, async (req, res) => {
  try {
    const contests = await Contest.find({ user: req.user._id }).sort({ date: -1 });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/contests
router.post("/", protect, async (req, res) => {
  try {
    const { name, date, rank, ratingBefore, ratingAfter, problemsSolved } = req.body;

    if (!name || !date || rank == null || ratingBefore == null || ratingAfter == null) {
      return res.status(400).json({ message: "Missing required contest fields" });
    }

    const contest = await Contest.create({
      user: req.user._id,
      name,
      date,
      rank,
      ratingBefore,
      ratingAfter,
      problemsSolved: problemsSolved || 0,
    });

    await syncCurrentRating(req.user._id);

    // Keep the contest even if the review generation fails - retryable below.
    try {
      const topics = await getTopicWiseStats(req.user._id);
      const prompt = buildContestReviewPrompt(contest, topics);
      const parsed = await callGeminiForJson(prompt);

      contest.review = { ...parsed, generatedAt: new Date() };
      await contest.save();
    } catch (aiErr) {
      console.error("Contest review generation failed:", aiErr.message);
    }

    res.status(201).json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/contests/:id/review
// Lets the user retry review generation if it failed when the contest was added.
router.post("/:id/review", protect, async (req, res) => {
  try {
    const contest = await Contest.findOne({ _id: req.params.id, user: req.user._id });
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const topics = await getTopicWiseStats(req.user._id);
    const prompt = buildContestReviewPrompt(contest, topics);
    const parsed = await callGeminiForJson(prompt);

    contest.review = { ...parsed, generatedAt: new Date() };
    await contest.save();

    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/contests/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const contest = await Contest.findOne({ _id: req.params.id, user: req.user._id });
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const { name, date, rank, ratingBefore, ratingAfter, problemsSolved } = req.body;

    if (name !== undefined) contest.name = name;
    if (date !== undefined) contest.date = date;
    if (rank !== undefined) contest.rank = rank;
    if (ratingBefore !== undefined) contest.ratingBefore = ratingBefore;
    if (ratingAfter !== undefined) contest.ratingAfter = ratingAfter;
    if (problemsSolved !== undefined) contest.problemsSolved = problemsSolved;

    await contest.save();
    await syncCurrentRating(req.user._id);

    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/contests/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const contest = await Contest.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    await syncCurrentRating(req.user._id);

    res.json({ message: "Contest deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
