const Submission = require("../models/Submission");

const DIFFICULTY_BUCKETS = [
  { label: "800-1100", min: 800, max: 1100 },
  { label: "1200-1500", min: 1200, max: 1500 },
  { label: "1600-1900", min: 1600, max: 1900 },
  { label: "2000-2300", min: 2000, max: 2300 },
  { label: "2400+", min: 2400, max: Infinity },
];

// A problem can appear in multiple submissions (retries, or solved during
// both a contest and later practice), so "solved" means at least one OK
// verdict per distinct problemId, not one per submission.
const getSolvedProblems = async (userId) => {
  const solved = await Submission.aggregate([
    { $match: { user: userId, verdict: "OK" } },
    { $group: { _id: "$problemId", tags: { $first: "$tags" }, rating: { $first: "$rating" } } },
  ]);
  return solved;
};

// Same idea as getSolvedProblems, but any verdict counts - used to show
// how many distinct problems per tag were attempted at all, not just solved.
const getAttemptedProblems = async (userId) => {
  const attempted = await Submission.aggregate([
    { $match: { user: userId } },
    { $group: { _id: "$problemId", tags: { $first: "$tags" } } },
  ]);
  return attempted;
};

const countByTag = (problems) => {
  const counts = {};
  for (const problem of problems) {
    for (const tag of problem.tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return counts;
};

const getTopicWiseStats = async (userId) => {
  const [solved, attempted] = await Promise.all([getSolvedProblems(userId), getAttemptedProblems(userId)]);
  const solvedCounts = countByTag(solved);
  const attemptedCounts = countByTag(attempted);

  const tags = new Set([...Object.keys(solvedCounts), ...Object.keys(attemptedCounts)]);

  return [...tags]
    .map((tag) => ({ tag, solved: solvedCounts[tag] || 0, attempted: attemptedCounts[tag] || 0 }))
    .sort((a, b) => b.solved - a.solved);
};

const getDifficultyWiseStats = async (userId) => {
  const solved = await getSolvedProblems(userId);

  return DIFFICULTY_BUCKETS.map((bucket) => ({
    range: bucket.label,
    solved: solved.filter((p) => p.rating >= bucket.min && p.rating <= bucket.max).length,
  }));
};

module.exports = { getSolvedProblems, getTopicWiseStats, getDifficultyWiseStats };
