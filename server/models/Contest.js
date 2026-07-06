const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

module.exports = mongoose.model("Contest", contestSchema);
