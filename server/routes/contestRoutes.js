const express = require("express");
const Contest = require("../models/Contest");
const Topic = require("../models/Topic");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const {
  callGemini,
  parseJsonResponse,
  buildContestReviewPrompt,
} = require("../utils/gemini");

const router = express.Router();

// Keeps User.currentRating in sync with whichever contest is most recent
// by date. Called after any add/edit/delete so the dashboard always shows
// an accurate number without the client having to recompute it.
const syncCurrentRating = async (userId) => {
  const latest = await Contest.findOne({ user: userId }).sort({ date: -1 });
  await User.findByIdAndUpdate(userId, {
    currentRating: latest ? latest.ratingAfter : 0,
  });
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

    // Generate the AI review right away. If Gemini fails for any reason
    // (missing key, rate limit, network) we still keep the contest -
    // the user can retry the review later instead of losing their data.
    try {
      const topics = await Topic.find({ user: req.user._id });
      const prompt = buildContestReviewPrompt(contest, topics);
      const rawText = await callGemini(prompt);
      const parsed = parseJsonResponse(rawText);

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

    const topics = await Topic.find({ user: req.user._id });
    const prompt = buildContestReviewPrompt(contest, topics);
    const rawText = await callGemini(prompt);
    const parsed = parseJsonResponse(rawText);

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
