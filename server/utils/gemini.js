const fetch = require("node-fetch");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

const callGemini = async (prompt) => {
  const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
};
const parseJsonResponse = (rawText) => {
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
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

const buildRecommendationsPrompt = ({ weakTopics, currentRating, targetRating, contests }) => `
You are a competitive programming coach recommending practice problems.

Weak topics: ${JSON.stringify(weakTopics)}
Current rating: ${currentRating}
Target rating: ${targetRating}
Recent contest count: ${contests.length}

Recommend exactly 5 practice problems that a student at this level could realistically
find on Codeforces or a similar judge. You do not need real problem links, but give a
realistic problem name/topic and an approximate difficulty rating.

Respond with ONLY valid JSON, no markdown fences, in exactly this shape:
{
  "recommendations": [
    {
      "title": "problem title or topic-based name",
      "difficulty": "approximate rating, e.g. 1400",
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
  parseJsonResponse,
  buildContestReviewPrompt,
  buildProgressAnalysisPrompt,
  buildWeeklyPlanPrompt,
  buildRecommendationsPrompt,
};
