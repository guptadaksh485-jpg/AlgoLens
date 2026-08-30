// "YYYY-MM-DD" in UTC, so server/client don't drift across timezones.
const toDateString = (date) => date.toISOString().split("T")[0];

// Consecutive active days counting back from today (or yesterday, if
// today has no activity yet).
const calculateStreak = (activityDates) => {
  if (!activityDates || activityDates.length === 0) return 0;

  const dateSet = new Set(activityDates);
  let streak = 0;
  const cursor = new Date();

  if (!dateSet.has(toDateString(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (dateSet.has(toDateString(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
};

// Last 7 days (oldest first) with whether each was an active day, for the
// Weekly Activity chart.
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
