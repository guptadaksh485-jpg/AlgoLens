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
    // Each entry is a "YYYY-MM-DD" string for a day the user logged at least
    // one solved/attempted problem. Used to compute the current streak and
    // the weekly activity chart without needing a separate daily-log collection.
    activityDates: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
