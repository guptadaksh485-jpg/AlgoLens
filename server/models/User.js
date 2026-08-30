const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    handle: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    currentRating: {
      type: Number,
      default: 0,
    },
    targetRating: {
      type: Number,
      default: 1600,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    // Set after a successful Codeforces sync; also used to rate-limit re-syncs.
    cfLastSyncedAt: {
      type: Date,
      default: null,
    },
    // "YYYY-MM-DD" strings for days with CF activity - powers streak +
    // weekly activity without a separate daily-log collection.
    activityDates: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
