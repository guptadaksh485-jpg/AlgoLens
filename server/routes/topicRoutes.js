const express = require("express");
const Topic = require("../models/Topic");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { TOPIC_NAMES } = require("../models/Topic");
const { toDateString } = require("../utils/streakCalculator");

const router = express.Router();

// @route   GET /api/topics
// Every user should always have exactly one doc per tracked topic. Rather
// than seeding all 9 at signup, we lazily create any that are missing the
// first time this route is hit - simpler than keeping signup and this route
// in sync with the topic list.
router.get("/", protect, async (req, res) => {
  try {
    const existing = await Topic.find({ user: req.user._id });
    const existingNames = existing.map((t) => t.name);
    const missingNames = TOPIC_NAMES.filter((name) => !existingNames.includes(name));

    if (missingNames.length > 0) {
      const toInsert = missingNames.map((name) => ({ user: req.user._id, name }));
      await Topic.insertMany(toInsert);
    }

    const topics = await Topic.find({ user: req.user._id }).sort({ name: 1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/topics/:id
// Body: { solvedDelta, attemptedDelta } - the client sends how many MORE
// problems were solved/attempted, rather than the new total, so two people
// (or two tabs) logging progress can't accidentally overwrite each other.
router.put("/:id", protect, async (req, res) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.id, user: req.user._id });
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    const { solvedDelta = 0, attemptedDelta = 0 } = req.body;

    topic.solved = Math.max(0, topic.solved + Number(solvedDelta));
    topic.attempted = Math.max(0, topic.attempted + Number(attemptedDelta));
    topic.lastPracticed = new Date();
    await topic.save();

    // Record today as an active day for streak + weekly activity purposes.
    const today = toDateString(new Date());
    await User.updateOne(
      { _id: req.user._id, activityDates: { $ne: today } },
      { $push: { activityDates: today } }
    );

    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
