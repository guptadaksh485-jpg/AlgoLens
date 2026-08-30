jest.mock("../utils/codeforcesClient");
jest.mock("../utils/cache");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { fetchProblemset } = require("../utils/codeforcesClient");
const { getCached, setCached } = require("../utils/cache");
const Submission = require("../models/Submission");
const { pickCandidates } = require("../utils/problemRecommender");

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
  getCached.mockResolvedValue(null);
  setCached.mockResolvedValue(undefined);
  fetchProblemset.mockResolvedValue({
    problems: [
      { contestId: 1, index: "A", name: "Already Solved", rating: 1300, tags: ["dp"] },
      { contestId: 2, index: "B", name: "Good Match", rating: 1350, tags: ["dp"] },
      { contestId: 3, index: "C", name: "Wrong Tag", rating: 1300, tags: ["geometry"] },
      { contestId: 4, index: "D", name: "Too Hard", rating: 2500, tags: ["dp"] },
    ],
  });
  await Submission.create({
    user: userId,
    submissionId: 1,
    problemId: "1A",
    problemName: "Already Solved",
    rating: 1300,
    tags: ["dp"],
    verdict: "OK",
    submittedAt: new Date(),
  });
});

it("excludes solved problems, wrong tags, and out-of-range ratings", async () => {
  const candidates = await pickCandidates(userId, ["dp"], 1300);
  expect(candidates).toHaveLength(1);
  expect(candidates[0].problemId).toBe("2B");
});
