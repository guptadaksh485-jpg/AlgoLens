const mongoose = require("mongoose");

const TOPIC_NAMES = [
  "Arrays",
  "Strings",
  "Trees",
  "Graphs",
  "DP",
  "Binary Search",
  "Greedy",
  "Backtracking",
  "Math",
];

const topicSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    enum: TOPIC_NAMES,
    required: true,
  },
  solved: {
    type: Number,
    default: 0,
  },
  attempted: {
    type: Number,
    default: 0,
  },
  lastPracticed: {
    type: Date,
    default: null,
  },
});

topicSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Topic", topicSchema);
module.exports.TOPIC_NAMES = TOPIC_NAMES;
