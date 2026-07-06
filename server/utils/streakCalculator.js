// Converts a Date to a "YYYY-MM-DD" string in UTC so we don't have to worry
// about timezone drift between the server and the client.
const toDateString = (date) => date.toISOString().split("T")[0];

// Given the list of "YYYY-MM-DD" strings a user has logged activity on,
// returns how many consecutive days (counting back from today, or from
// yesterday if nothing was logged today) the user has stayed active.
const calculateStreak = (activityDates) => {
  if (!activityDates || activityDates.length === 0) return 0;

  const dateSet = new Set(activityDates);
  let streak = 0;
  const cursor = new Date();

  // If today has no activity yet, start checking from yesterday instead,
  // so the streak doesn't reset to 0 the moment the clock passes midnight.
  if (!dateSet.has(toDateString(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (dateSet.has(toDateString(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
};

// Returns solved-problem counts for the last 7 days (including today),
// oldest first, for the Weekly Activity chart. `activityDates` only tells us
// *that* a day was active, so we pair it with topic docs to get counts.
const buildWeeklyActivity = (activityDates) => {
  const dateSet = new Set(activityDates);
  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = toDateString(d);
    days.push({
      date: dateStr,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      active: dateSet.has(dateStr),
    });
  }

  return days;
};

module.exports = { toDateString, calculateStreak, buildWeeklyActivity };
