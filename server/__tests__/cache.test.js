jest.mock("../utils/redisClient");
const { getRedisClient } = require("../utils/redisClient");
const { getCached, setCached, deleteCached, allowOncePerWindow } = require("../utils/cache");

describe("cache helpers with Redis unavailable", () => {
  beforeEach(() => getRedisClient.mockReturnValue(null));

  it("getCached returns null instead of throwing", async () => {
    expect(await getCached("some-key")).toBeNull();
  });

  it("allowOncePerWindow fails open (allows the call)", async () => {
    expect(await allowOncePerWindow("some-key", 60)).toBe(true);
  });
});

describe("cache helpers with Redis available", () => {
  const store = new Map();
  const fakeClient = {
    isReady: true,
    get: jest.fn((key) => Promise.resolve(store.get(key) || null)),
    set: jest.fn((key, value, opts) => {
      if (opts?.NX && store.has(key)) return Promise.resolve(null);
      store.set(key, value);
      return Promise.resolve("OK");
    }),
    del: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve(1);
    }),
  };

  beforeEach(() => {
    store.clear();
    getRedisClient.mockReturnValue(fakeClient);
  });

  it("round-trips a JSON value", async () => {
    await setCached("k1", { a: 1 }, 60);
    expect(await getCached("k1")).toEqual({ a: 1 });
  });

  it("deleteCached removes a previously cached value", async () => {
    await setCached("k1", { a: 1 }, 60);
    await deleteCached("k1");
    expect(await getCached("k1")).toBeNull();
  });

  it("allowOncePerWindow only allows the first call in the window", async () => {
    expect(await allowOncePerWindow("sync:user1", 60)).toBe(true);
    expect(await allowOncePerWindow("sync:user1", 60)).toBe(false);
  });
});
