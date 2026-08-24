import { describe, expect, it } from "vitest";

import { currentStreak, lastNDays, startOfWeek } from "../streak";

const at = (year: number, month: number, day: number, hour = 12) =>
  new Date(year, month - 1, day, hour);

describe("currentStreak", () => {
  const now = at(2026, 8, 24);

  it("is zero with no history", () => {
    expect(currentStreak([], now)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(currentStreak([at(2026, 8, 24), at(2026, 8, 23), at(2026, 8, 22)], now)).toBe(3);
  });

  it("stays alive when today has no session yet", () => {
    expect(currentStreak([at(2026, 8, 23), at(2026, 8, 22)], now)).toBe(2);
  });

  it("breaks once a day is skipped", () => {
    expect(currentStreak([at(2026, 8, 24), at(2026, 8, 22), at(2026, 8, 21)], now)).toBe(1);
  });

  it("counts a day once no matter how many sittings", () => {
    expect(currentStreak([at(2026, 8, 24, 9), at(2026, 8, 24, 22)], now)).toBe(1);
  });

  it("is zero when the last session is too old", () => {
    expect(currentStreak([at(2026, 8, 1)], now)).toBe(0);
  });
});

describe("startOfWeek", () => {
  it("starts on Monday", () => {
    // 2026-08-24 is a Monday.
    expect(startOfWeek(at(2026, 8, 24)).getDate()).toBe(24);
    // 2026-08-23 is the Sunday before it.
    expect(startOfWeek(at(2026, 8, 23)).getDate()).toBe(17);
  });
});

describe("lastNDays", () => {
  it("returns n days ending today, oldest first", () => {
    const days = lastNDays(7, at(2026, 8, 24));
    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(18);
    expect(days[6].getDate()).toBe(24);
  });
});
