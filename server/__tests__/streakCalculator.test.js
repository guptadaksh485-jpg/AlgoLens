const { toDateString, calculateStreak, buildWeeklyActivity } = require("../utils/streakCalculator");

const daysAgoStr = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return toDateString(d);
};

describe("calculateStreak", () => {
  it("returns 0 for no activity", () => {
    expect(calculateStreak([])).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const dates = [daysAgoStr(0), daysAgoStr(1), daysAgoStr(2)];
    expect(calculateStreak(dates)).toBe(3);
  });

  it("still counts the streak if today hasn't been logged yet", () => {
    const dates = [daysAgoStr(1), daysAgoStr(2)];
    expect(calculateStreak(dates)).toBe(2);
  });

  it("resets when there's a gap", () => {
    const dates = [daysAgoStr(0), daysAgoStr(3)];
    expect(calculateStreak(dates)).toBe(1);
  });
});

describe("buildWeeklyActivity", () => {
  it("returns 7 days ending today, marking active ones", () => {
    const week = buildWeeklyActivity([daysAgoStr(0), daysAgoStr(2)]);
    expect(week).toHaveLength(7);
    expect(week[6].active).toBe(true);
    expect(week[6].date).toBe(daysAgoStr(0));
  });
});
