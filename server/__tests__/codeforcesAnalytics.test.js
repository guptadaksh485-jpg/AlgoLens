const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Submission = require("../models/Submission");
const { getTopicWiseStats, getDifficultyWiseStats } = require("../utils/codeforcesAnalytics");

let mongo;
const userId = new mongoose.Types.ObjectId();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Submission.deleteMany({});
  await Submission.create([
    { user: userId, submissionId: 1, problemId: "1A", problemName: "A", rating: 800, tags: ["dp"], verdict: "OK", submittedAt: new Date() },
    { user: userId, submissionId: 2, problemId: "1B", problemName: "B", rating: 1300, tags: ["dp", "graphs"], verdict: "OK", submittedAt: new Date() },
    { user: userId, submissionId: 3, problemId: "1B", problemName: "B", rating: 1300, tags: ["dp", "graphs"], verdict: "WRONG_ANSWER", submittedAt: new Date() },
    { user: userId, submissionId: 4, problemId: "1C", problemName: "C", rating: 2000, tags: ["greedy"], verdict: "OK", submittedAt: new Date() },
  ]);
});

describe("getTopicWiseStats", () => {
  it("counts each solved problem once per tag, ignoring non-OK verdicts", async () => {
    const stats = await getTopicWiseStats(userId);
    const byTag = Object.fromEntries(stats.map((s) => [s.tag, s.solved]));

    expect(byTag.dp).toBe(2);
    expect(byTag.graphs).toBe(1);
    expect(byTag.greedy).toBe(1);
  });

  it("counts attempted problems per tag regardless of verdict", async () => {
    const stats = await getTopicWiseStats(userId);
    const byTag = Object.fromEntries(stats.map((s) => [s.tag, s.attempted]));

    // 1B was submitted twice (once OK, once WRONG_ANSWER) but is one distinct problem.
    expect(byTag.dp).toBe(2);
    expect(byTag.graphs).toBe(1);
    expect(byTag.greedy).toBe(1);
  });
});

describe("getDifficultyWiseStats", () => {
  it("buckets solved problems by rating range", async () => {
    const stats = await getDifficultyWiseStats(userId);
    const byRange = Object.fromEntries(stats.map((s) => [s.range, s.solved]));

    expect(byRange["800-1100"]).toBe(1);
    expect(byRange["1200-1500"]).toBe(1);
    expect(byRange["2000-2300"]).toBe(1);
  });
});
