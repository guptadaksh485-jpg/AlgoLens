const fetch = require("node-fetch");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Only retried on 429 (rate limited) and 503 (temporarily overloaded) -
// both are transient and worth a short backoff; anything else (4xx auth/bad
// request, etc.) fails immediately since retrying won't help.
const RETRYABLE_STATUSES = new Set([429, 503]);
const MAX_RETRIES = 2; // up to 3 total attempts
const BASE_DELAY_MS = 300;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async (prompt) => {
  let attempt = 0;

  while (true) {
    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();

      if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * 2 ** attempt;
        attempt += 1;
        await sleep(delay);
        continue;
      }

      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    // Gemini 3.x can include parts that carry only a thoughtSignature (no
    // text), so join every text part rather than assuming parts[0] is the answer.
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.filter((p) => p.text).map((p) => p.text).join("");

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    return text;
  }
};

const parseJsonResponse = (rawText) => {
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
};

// Retries once with a stricter reminder if Gemini's response isn't valid JSON.
const callGeminiForJson = async (prompt) => {
  const firstAttempt = await callGemini(prompt);
  try {
    return parseJsonResponse(firstAttempt);
  } catch (err) {
    const retryText = await callGemini(`${prompt}\n\nYour previous response was not valid JSON. Respond with ONLY the JSON object, nothing else.`);
    return parseJsonResponse(retryText);
  }
};

const buildContestReviewPrompt = (contest, recentTopics) => `
You are a competitive programming coach. A student just logged this contest:

Contest name: ${contest.name}
Rank: ${contest.rank}
Rating before: ${contest.ratingBefore}
Rating after: ${contest.ratingAfter}
Problems solved: ${contest.problemsSolved}

Their recent topic stats (solved/attempted): ${JSON.stringify(recentTopics)}

Respond with ONLY valid JSON, no markdown fences, in exactly this shape:
{
  "summary": "2-3 sentence summary of how this contest went",
  "strongPoints": ["short point", "short point"],
  "weakPoints": ["short point", "short point"],
  "biggestMistake": "one sentence describing the most likely biggest mistake",
  "improvementSuggestion": "one concrete, actionable suggestion for next contest"
}
`;

const buildProgressAnalysisPrompt = ({ user, contests, topics }) => `
You are a competitive programming coach analyzing a student's overall progress.

Current rating: ${user.currentRating}
Target rating: ${user.targetRating}

Contest history (most recent last): ${JSON.stringify(
  contests.map((c) => ({
    name: c.name,
    date: c.date,
    rank: c.rank,
    ratingBefore: c.ratingBefore,
    ratingAfter: c.ratingAfter,
    problemsSolved: c.problemsSolved,
  }))
)}

Topic statistics: ${JSON.stringify(
  topics.map((t) => ({ name: t.name, solved: t.solved, attempted: t.attempted }))
)}

Respond with ONLY valid JSON, no markdown fences, in exactly this shape:
{
  "strongestTopics": ["topic", "topic"],
  "weakestTopics": ["topic", "topic"],
  "performanceTrend": "one paragraph describing whether they are improving, plateauing, or declining, and why",
  "suggestions": ["personalized suggestion 1", "personalized suggestion 2", "personalized suggestion 3"]
}
`;

const buildWeeklyPlanPrompt = ({ targetRating, hoursPerDay, currentRating, weakestTopics }) => `
You are a competitive programming coach building a study plan.

Current rating: ${currentRating}
Target rating: ${targetRating}
Hours available per day: ${hoursPerDay}
Weakest topics: ${JSON.stringify(weakestTopics)}

Build a realistic 7-day study plan that fits within the hours available per day.
Respond with ONLY valid JSON, no markdown fences, in exactly this shape:
{
  "days": [
    { "day": "Monday", "focus": "topic or theme", "tasks": ["task 1", "task 2"] }
  ]
}
The "days" array must have exactly 7 entries, Monday through Sunday.
`;

// Hands over real unsolved CF problems (picked in problemRecommender.js) so
// Gemini only explains picks instead of inventing problems that don't exist.
const buildRecommendationsPrompt = ({ weakTopics, currentRating, targetRating, candidates }) => `
You are a competitive programming coach recommending practice problems.

Weak topics: ${JSON.stringify(weakTopics)}
Current rating: ${currentRating}
Target rating: ${targetRating}

Here are real candidate Codeforces problems the student has not solved yet:
${JSON.stringify(candidates)}

Pick the best 5 from this list and explain why each helps. Do not invent problems -
only use the ones listed above, and reuse their exact title, rating, and problemId.

Respond with ONLY valid JSON, no markdown fences, in exactly this shape:
{
  "recommendations": [
    {
      "problemId": "must match a problemId from the candidate list",
      "title": "must match the candidate's title",
      "difficulty": "must match the candidate's rating",
      "reason": "why this was chosen",
      "improves": "which weakness it targets",
      "order": 1
    }
  ]
}
The "recommendations" array must have exactly 5 entries, ordered by suggested solving order.
`;

module.exports = {
  callGemini,
  callGeminiForJson,
  parseJsonResponse,
  buildContestReviewPrompt,
  buildProgressAnalysisPrompt,
  buildWeeklyPlanPrompt,
  buildRecommendationsPrompt,
};
