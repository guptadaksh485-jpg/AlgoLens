const { createClient } = require("redis");

let client = null;

// Redis is a nice-to-have (caching + rate limiting), not a hard dependency -
// the app should still work without it in local dev. So we connect lazily
// and swallow connection errors instead of crashing the process.
const getRedisClient = () => {
  if (client) return client;
  if (!process.env.REDIS_URL) return null;

  client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (err) => console.warn("Redis error:", err.message));
  client.connect().catch((err) => console.warn("Redis connection failed:", err.message));

  return client;
};

module.exports = { getRedisClient };
