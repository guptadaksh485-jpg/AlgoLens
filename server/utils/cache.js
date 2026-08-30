const { getRedisClient } = require("./redisClient");

// These all fail open: if Redis is down or unconfigured, caching and rate
// limiting are simply skipped rather than breaking the request.

const getCached = async (key) => {
  const client = getRedisClient();
  if (!client || !client.isReady) return null;

  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

const setCached = async (key, value, ttlSeconds) => {
  const client = getRedisClient();
  if (!client || !client.isReady) return;

  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    // Caching is an optimization, not a correctness requirement - ignore.
  }
};

// Used to invalidate a cached value right after the underlying data changes,
// e.g. clearing cached analytics once a fresh Codeforces sync completes.
const deleteCached = async (key) => {
  const client = getRedisClient();
  if (!client || !client.isReady) return;

  try {
    await client.del(key);
  } catch (err) {
    // Same reasoning as setCached - not worth failing the request over.
  }
};

// Returns true if the caller is allowed to proceed, false if they're
// within `windowSeconds` of their last allowed call. Used to stop a user
// from re-triggering an expensive Codeforces sync every few seconds.
const allowOncePerWindow = async (key, windowSeconds) => {
  const client = getRedisClient();
  if (!client || !client.isReady) return true;

  try {
    // NX = only set if not already set, so this doubles as an atomic lock.
    const result = await client.set(key, "1", { EX: windowSeconds, NX: true });
    return result === "OK";
  } catch (err) {
    return true;
  }
};

module.exports = { getCached, setCached, deleteCached, allowOncePerWindow };
