const mongoose = require("mongoose");

// One doc per Codeforces submission a user has, used to compute
// topic/difficulty analytics without re-hitting the CF API.
const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submissionId: {
    type: Number,
    required: true,
  },
  problemId: {
    // contestId + index (e.g. "1500A") - CF problems have no single numeric id.
    type: String,
    required: true,
  },
  problemName: {
    type: String,
    required: true,
  },
  // Lets contest-time solves be grouped by contest without reparsing problemId.
  contestId: {
    type: Number,
    default: null,
  },
  // "CONTESTANT" vs "PRACTICE"/"VIRTUAL" - needed for per-contest solved counts.
  participantType: {
    type: String,
    default: null,
  },
  rating: {
    type: Number,
    default: null,
  },
  tags: {
    type: [String],
    default: [],
  },
  verdict: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    required: true,
  },
});

// Prevents the same submission being stored twice on repeat syncs.
submissionSchema.index({ user: 1, submissionId: 1 }, { unique: true });
// Powers the analytics aggregation (distinct solved problems per user).
submissionSchema.index({ user: 1, verdict: 1, problemId: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
