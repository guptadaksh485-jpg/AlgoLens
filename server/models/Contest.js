const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Set only for contests brought in by a Codeforces sync, so re-syncing
    // updates the same doc instead of creating duplicates. Manually-added
    // contests leave this null.
    cfContestId: {
      type: Number,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    ratingBefore: {
      type: Number,
      required: true,
    },
    ratingAfter: {
      type: Number,
      required: true,
    },
    problemsSolved: {
      type: Number,
      required: true,
      default: 0,
    },
    // AI-generated review is stored directly on the contest since it always
    // belongs to exactly one contest. Filled in after Gemini responds.
    review: {
      summary: { type: String, default: "" },
      strongPoints: { type: [String], default: [] },
      weakPoints: { type: [String], default: [] },
      biggestMistake: { type: String, default: "" },
      improvementSuggestion: { type: String, default: "" },
      generatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

contestSchema.index(
  { user: 1, cfContestId: 1 },
  { unique: true, partialFilterExpression: { cfContestId: { $type: "number" } } }
);

module.exports = mongoose.model("Contest", contestSchema);
