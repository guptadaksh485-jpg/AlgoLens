jest.mock("../utils/codeforcesClient");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { fetchUserInfo, fetchUserSubmissions, fetchUserRating } = require("../utils/codeforcesClient");
const { syncUserSubmissions } = require("../utils/codeforcesSync");
const Submission = require("../models/Submission");
const Contest = require("../models/Contest");

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await Submission.deleteMany({});
  await Contest.deleteMany({});
  jest.resetAllMocks();
});

const userId = new mongoose.Types.ObjectId();
const fakeSubmission = (id, { verdict = "OK", participantType = "CONTESTANT" } = {}) => ({
  id,
  creationTimeSeconds: 1700000000,
  verdict,
  problem: { contestId: 1500, index: "A", name: "Test Problem", rating: 1200, tags: ["dp"] },
  author: { participantType },
});

beforeEach(() => {
  fetchUserRating.mockResolvedValue([]);
});

describe("syncUserSubmissions", () => {
  it("stores each submission once", async () => {
    fetchUserInfo.mockResolvedValue([{ rating: 1450 }]);
    fetchUserSubmissions.mockResolvedValue([fakeSubmission(1), fakeSubmission(2)]);

    const result = await syncUserSubmissions(userId, "someone");

    expect(result.cfRating).toBe(1450);
    expect(await Submission.countDocuments({ user: userId })).toBe(2);
  });

  it("does not duplicate already-seen submissions on a second sync", async () => {
    fetchUserInfo.mockResolvedValue([{ rating: 1450 }]);
    fetchUserSubmissions.mockResolvedValue([fakeSubmission(1), fakeSubmission(2)]);
    await syncUserSubmissions(userId, "someone");

    fetchUserSubmissions.mockResolvedValue([fakeSubmission(1), fakeSubmission(2), fakeSubmission(3)]);
    await syncUserSubmissions(userId, "someone");

    expect(await Submission.countDocuments({ user: userId })).toBe(3);
  });

  it("skips submissions with no problem data", async () => {
    fetchUserInfo.mockResolvedValue([{ rating: 1450 }]);
    fetchUserSubmissions.mockResolvedValue([{ id: 1, creationTimeSeconds: 1700000000, verdict: "OK" }]);

    await syncUserSubmissions(userId, "someone");
    expect(await Submission.countDocuments({ user: userId })).toBe(0);
  });

  it("returns one active-day date per distinct submission day", async () => {
    fetchUserInfo.mockResolvedValue([{ rating: 1450 }]);
    fetchUserSubmissions.mockResolvedValue([
      fakeSubmission(1),
      { ...fakeSubmission(2), creationTimeSeconds: 1700000000 + 86400 },
    ]);

    const result = await syncUserSubmissions(userId, "someone");
    expect(result.activityDates).toHaveLength(2);
  });

  it("upserts real contest history and computes problems solved from contest-time submissions", async () => {
    fetchUserInfo.mockResolvedValue([{ rating: 1450 }]);
    fetchUserSubmissions.mockResolvedValue([
      fakeSubmission(1, { participantType: "CONTESTANT" }),
      { ...fakeSubmission(2, { participantType: "PRACTICE" }), problem: { contestId: 1500, index: "B", name: "B", rating: 1300, tags: ["dp"] } },
    ]);
    fetchUserRating.mockResolvedValue([
      { contestId: 1500, contestName: "Round 1", rank: 120, oldRating: 1400, newRating: 1450, ratingUpdateTimeSeconds: 1700000000 },
    ]);

    const result = await syncUserSubmissions(userId, "someone");
    expect(result.contestsSeen).toBe(1);

    const contest = await Contest.findOne({ user: userId, cfContestId: 1500 });
    expect(contest.name).toBe("Round 1");
    expect(contest.ratingBefore).toBe(1400);
    expect(contest.ratingAfter).toBe(1450);
    // Only the CONTESTANT submission (problem A) counts - the PRACTICE
    // submission for problem B shouldn't inflate this contest's solved count.
    expect(contest.problemsSolved).toBe(1);
  });

  it("updates the same contest doc on a second sync instead of duplicating it", async () => {
    fetchUserInfo.mockResolvedValue([{ rating: 1450 }]);
    fetchUserSubmissions.mockResolvedValue([fakeSubmission(1)]);
    fetchUserRating.mockResolvedValue([
      { contestId: 1500, contestName: "Round 1", rank: 120, oldRating: 1400, newRating: 1450, ratingUpdateTimeSeconds: 1700000000 },
    ]);
    await syncUserSubmissions(userId, "someone");

    fetchUserRating.mockResolvedValue([
      { contestId: 1500, contestName: "Round 1", rank: 90, oldRating: 1400, newRating: 1480, ratingUpdateTimeSeconds: 1700000000 },
    ]);
    await syncUserSubmissions(userId, "someone");

    expect(await Contest.countDocuments({ user: userId })).toBe(1);
    const contest = await Contest.findOne({ user: userId, cfContestId: 1500 });
    expect(contest.rank).toBe(90);
    expect(contest.ratingAfter).toBe(1480);
  });

  it("does not touch a manually-added contest's review when syncing", async () => {
    await Contest.create({
      user: userId,
      name: "Manually logged contest",
      date: new Date(),
      rank: 50,
      ratingBefore: 1000,
      ratingAfter: 1050,
      problemsSolved: 2,
      review: { summary: "Nice round", generatedAt: new Date() },
    });

    fetchUserInfo.mockResolvedValue([{ rating: 1450 }]);
    fetchUserSubmissions.mockResolvedValue([fakeSubmission(1)]);
    fetchUserRating.mockResolvedValue([
      { contestId: 1500, contestName: "Round 1", rank: 120, oldRating: 1400, newRating: 1450, ratingUpdateTimeSeconds: 1700000000 },
    ]);
    await syncUserSubmissions(userId, "someone");

    expect(await Contest.countDocuments({ user: userId })).toBe(2);
    const manual = await Contest.findOne({ user: userId, cfContestId: null });
    expect(manual.review.summary).toBe("Nice round");
  });
});
