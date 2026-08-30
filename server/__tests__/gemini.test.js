jest.mock("node-fetch");
const fetch = require("node-fetch");
const { callGemini, callGeminiForJson, parseJsonResponse } = require("../utils/gemini");

const geminiResponse = (text) => ({
  ok: true,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

const errorResponse = (status) => ({
  ok: false,
  status,
  text: async () => `upstream ${status}`,
});

describe("parseJsonResponse", () => {
  it("strips markdown fences before parsing", () => {
    expect(parseJsonResponse("```json\n{\"a\":1}\n```")).toEqual({ a: 1 });
  });
});

describe("callGeminiForJson", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns parsed JSON on the first valid response", async () => {
    fetch.mockResolvedValue(geminiResponse('{"ok":true}'));
    expect(await callGeminiForJson("prompt")).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries once when the first response is malformed", async () => {
    fetch
      .mockResolvedValueOnce(geminiResponse("not json at all"))
      .mockResolvedValueOnce(geminiResponse('{"ok":true}'));

    expect(await callGeminiForJson("prompt")).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws if both attempts are malformed", async () => {
    fetch.mockResolvedValue(geminiResponse("still not json"));
    await expect(callGeminiForJson("prompt")).rejects.toThrow();
  });
});

describe("callGemini retry on transient errors", () => {
  afterEach(() => jest.resetAllMocks());

  // Backoff delays are small (300ms/600ms), so real timers keep this test
  // simple and reliable rather than fighting fake-timer/microtask ordering.
  it("retries on 503 and succeeds once the provider recovers", async () => {
    fetch
      .mockResolvedValueOnce(errorResponse(503))
      .mockResolvedValueOnce(errorResponse(503))
      .mockResolvedValueOnce(geminiResponse("recovered"));

    const result = await callGemini("prompt");

    expect(result).toBe("recovered");
    expect(fetch).toHaveBeenCalledTimes(3);
  }, 10000);

  it("retries on 429 the same way as 503", async () => {
    fetch
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(geminiResponse("ok after rate limit"));

    const result = await callGemini("prompt");

    expect(result).toBe("ok after rate limit");
    expect(fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it("stops after 3 total attempts and throws cleanly if still 503", async () => {
    fetch.mockResolvedValue(errorResponse(503));

    await expect(callGemini("prompt")).rejects.toThrow(/Gemini API error \(503\)/);
    expect(fetch).toHaveBeenCalledTimes(3);
  }, 10000);

  it("does not retry non-retryable errors like 400", async () => {
    fetch.mockResolvedValue(errorResponse(400));

    await expect(callGemini("prompt")).rejects.toThrow(/Gemini API error \(400\)/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
