jest.mock("node-fetch");
const fetch = require("node-fetch");
const { fetchUserInfo, fetchUserRating, CodeforcesError } = require("../utils/codeforcesClient");

const mockResponse = (status, body) => ({
  status,
  json: async () => body,
});

describe("codeforcesClient error classification", () => {
  it("throws INVALID_HANDLE when Codeforces says handle not found", async () => {
    fetch.mockResolvedValue(mockResponse(200, { status: "FAILED", comment: "handle: User not found" }));

    await expect(fetchUserInfo("nonexistent")).rejects.toMatchObject({ code: "INVALID_HANDLE" });
  });

  it("throws RATE_LIMITED on a 429 response", async () => {
    fetch.mockResolvedValue({ status: 429, json: async () => ({}) });

    await expect(fetchUserInfo("someone")).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("throws NETWORK_ERROR when the fetch itself fails", async () => {
    fetch.mockRejectedValue(new Error("ECONNRESET"));

    await expect(fetchUserInfo("someone")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });

  it("returns the result on success", async () => {
    fetch.mockResolvedValue(mockResponse(200, { status: "OK", result: [{ handle: "tourist" }] }));

    const result = await fetchUserInfo("tourist");
    expect(result).toEqual([{ handle: "tourist" }]);
  });

  it("wraps unrecognized failures as UPSTREAM_ERROR", async () => {
    fetch.mockResolvedValue(mockResponse(200, { status: "FAILED", comment: "something odd" }));

    await expect(fetchUserInfo("someone")).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
  });

  it("fetchUserRating returns the contest rating history on success", async () => {
    const history = [{ contestId: 1500, contestName: "Round 1", rank: 100, oldRating: 1400, newRating: 1450 }];
    fetch.mockResolvedValue(mockResponse(200, { status: "OK", result: history }));

    expect(await fetchUserRating("tourist")).toEqual(history);
  });
});
