const mongoose = require("mongoose");

// One collection holds all three "standalone" AI features (everything except
// contest review, which lives on the Contest document itself). The `type`
// field tells us which shape `content` is in, so we don't need three
// near-identical collections for what is really the same "AI ran and we
// saved the result" pattern.
const aiAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["progress", "plan", "recommendations"],
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);
