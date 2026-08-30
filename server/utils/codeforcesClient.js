const fetch = require("node-fetch");

const BASE_URL = "https://codeforces.com/api";

class CodeforcesError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

// Codeforces returns 200 with { status: "FAILED", comment: "..." } for most
// errors (bad handle, bad params) rather than a proper HTTP error code, so we
// have to inspect the body to classify what went wrong.
const classifyFailure = (comment) => {
  if (/not found/i.test(comment)) return "INVALID_HANDLE";
  if (/limit exceeded|too many requests/i.test(comment)) return "RATE_LIMITED";
  return "UPSTREAM_ERROR";
};

const callCodeforces = async (endpoint, params) => {
  const query = new URLSearchParams(params).toString();
  let response;
  try {
    response = await fetch(`${BASE_URL}/${endpoint}?${query}`);
  } catch (err) {
    throw new CodeforcesError("Could not reach Codeforces", "NETWORK_ERROR");
  }

  if (response.status === 429) {
    throw new CodeforcesError("Codeforces rate limit hit, try again shortly", "RATE_LIMITED");
  }

  const data = await response.json();

  if (data.status !== "OK") {
    throw new CodeforcesError(data.comment || "Codeforces request failed", classifyFailure(data.comment || ""));
  }

  return data.result;
};

const fetchUserInfo = (handle) => callCodeforces("user.info", { handles: handle });

// Full problem set - changes rarely, so callers should cache it.
const fetchProblemset = () => callCodeforces("problemset.problems", {});

// count=10000 comfortably covers a normal competitive programmer's full
// submission history in one call; Codeforces caps this endpoint anyway.
const fetchUserSubmissions = (handle) =>
  callCodeforces("user.status", { handle, from: 1, count: 10000 });

// Real contest participation + rating history, one entry per rated contest.
const fetchUserRating = (handle) => callCodeforces("user.rating", { handle });

module.exports = {
  CodeforcesError,
  fetchUserInfo,
  fetchUserSubmissions,
  fetchUserRating,
  fetchProblemset,
};
