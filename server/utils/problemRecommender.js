const Submission = require("../models/Submission");
const { fetchProblemset } = require("./codeforcesClient");
const { getCached, setCached } = require("./cache");

const PROBLEMSET_CACHE_KEY = "cf-problemset";
const PROBLEMSET_CACHE_SECONDS = 60 * 60 * 6; // problemset barely changes; 6h is plenty fresh
const RATING_WINDOW = 200; // how far above/below current rating counts as "reachable"

const getProblemset = async () => {
  const cached = await getCached(PROBLEMSET_CACHE_KEY);
  if (cached) return cached;

  const { problems } = await fetchProblemset();
  await setCached(PROBLEMSET_CACHE_KEY, problems, PROBLEMSET_CACHE_SECONDS);
  return problems;
};

// Picks unsolved problems that touch the student's weak topics and sit
// within reach of their current rating - real problems, not AI-invented
// ones. Gemini's only job after this is explaining the picks.
const pickCandidates = async (userId, weakTopics, currentRating, limit = 10) => {
  const [problems, solvedDocs] = await Promise.all([
    getProblemset(),
    Submission.find({ user: userId, verdict: "OK" }).distinct("problemId"),
  ]);
  const solved = new Set(solvedDocs);
  const weakSet = new Set(weakTopics.map((t) => t.toLowerCase()));

  const matches = problems.filter((p) => {
    const problemId = `${p.contestId}${p.index}`;
    if (solved.has(problemId)) return false;
    if (!p.rating) return false;
    if (Math.abs(p.rating - currentRating) > RATING_WINDOW) return false;
    return p.tags.some((tag) => weakSet.has(tag.toLowerCase()));
  });

  return matches.slice(0, limit).map((p) => ({
    problemId: `${p.contestId}${p.index}`,
    title: p.name,
    rating: p.rating,
    tags: p.tags,
  }));
};

module.exports = { pickCandidates };
