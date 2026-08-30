const Submission = require("../models/Submission");
const Contest = require("../models/Contest");
const { fetchUserInfo, fetchUserSubmissions, fetchUserRating } = require("./codeforcesClient");
const { toDateString } = require("./streakCalculator");

// Upserts a user's full CF submission and contest-rating history into Mongo.
// Unique indexes on (user, submissionId) and (user, cfContestId) make repeat
// syncs safe - already-seen data is skipped/updated, not duplicated.
const syncUserSubmissions = async (userId, handle) => {
  const [info, submissions, ratingHistory] = await Promise.all([
    fetchUserInfo(handle),
    fetchUserSubmissions(handle),
    fetchUserRating(handle),
  ]);

  const validSubmissions = submissions.filter((s) => s.problem); // a handful of old CF submissions lack problem data

  const submissionOps = validSubmissions.map((s) => ({
    updateOne: {
      filter: { user: userId, submissionId: s.id },
      update: {
        $setOnInsert: {
          user: userId,
          submissionId: s.id,
          problemId: `${s.problem.contestId || ""}${s.problem.index}`,
          problemName: s.problem.name,
          contestId: s.problem.contestId || null,
          participantType: s.author?.participantType || null,
          rating: s.problem.rating || null,
          tags: s.problem.tags || [],
          verdict: s.verdict,
          submittedAt: new Date(s.creationTimeSeconds * 1000),
        },
      },
      upsert: true,
    },
  }));

  if (submissionOps.length > 0) {
    await Submission.bulkWrite(submissionOps, { ordered: false });
  }

  // Only contest-time (CONTESTANT) submissions count, so later practice
  // solves don't inflate a contest's "problems solved".
  const solvedPerContest = await Submission.aggregate([
    { $match: { user: userId, verdict: "OK", participantType: "CONTESTANT", contestId: { $ne: null } } },
    { $group: { _id: { contestId: "$contestId", problemId: "$problemId" } } },
    { $group: { _id: "$_id.contestId", count: { $sum: 1 } } },
  ]);
  const solvedCountByContest = Object.fromEntries(solvedPerContest.map((c) => [c._id, c.count]));

  const contestOps = ratingHistory.map((entry) => ({
    updateOne: {
      filter: { user: userId, cfContestId: entry.contestId },
      update: {
        $set: {
          name: entry.contestName,
          date: new Date(entry.ratingUpdateTimeSeconds * 1000),
          rank: entry.rank,
          ratingBefore: entry.oldRating,
          ratingAfter: entry.newRating,
          problemsSolved: solvedCountByContest[entry.contestId] || 0,
        },
        $setOnInsert: { user: userId, cfContestId: entry.contestId },
      },
      upsert: true,
    },
  }));

  if (contestOps.length > 0) {
    await Contest.bulkWrite(contestOps, { ordered: false });
  }

  // Any day with a submission counts as active, for streak/weekly activity.
  const activityDates = [...new Set(validSubmissions.map((s) => toDateString(new Date(s.creationTimeSeconds * 1000))))];

  return {
    cfRating: info[0]?.rating || 0,
    submissionsSeen: submissions.length,
    contestsSeen: ratingHistory.length,
    activityDates,
  };
};

module.exports = { syncUserSubmissions };
