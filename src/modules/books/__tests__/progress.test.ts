import { describe, expect, it } from "vitest";

import {
  advanceCurrentPage,
  clampPage,
  isStale,
  nextStartPage,
  pagesInRange,
  pagesRemaining,
  progressPercent,
} from "../progress";

describe("progressPercent", () => {
  it("reports whole percentages", () => {
    expect(progressPercent(0, 380)).toBe(0);
    expect(progressPercent(142, 380)).toBe(37);
    expect(progressPercent(380, 380)).toBe(100);
  });

  it("never exceeds 100 or divides by zero", () => {
    expect(progressPercent(500, 380)).toBe(100);
    expect(progressPercent(10, 0)).toBe(0);
  });
});

describe("nextStartPage", () => {
  it("resumes on the page after the bookmark", () => {
    expect(nextStartPage(142, 380)).toBe(143);
  });

  it("starts a fresh book at page 1", () => {
    expect(nextStartPage(0, 380)).toBe(1);
  });

  it("does not run past the last page", () => {
    expect(nextStartPage(380, 380)).toBe(380);
    expect(nextStartPage(999, 380)).toBe(380);
  });
});

describe("pagesRemaining", () => {
  it("counts what is left", () => {
    expect(pagesRemaining(142, 380)).toBe(238);
    expect(pagesRemaining(380, 380)).toBe(0);
    expect(pagesRemaining(400, 380)).toBe(0);
  });
});

describe("advanceCurrentPage", () => {
  it("moves the bookmark forward", () => {
    expect(advanceCurrentPage(142, 190, 380)).toBe(190);
  });

  it("does not move backwards when re-reading an earlier stretch", () => {
    expect(advanceCurrentPage(300, 120, 380)).toBe(300);
  });

  it("clamps to the last page", () => {
    expect(advanceCurrentPage(0, 999, 380)).toBe(380);
  });
});

describe("pagesInRange", () => {
  it("counts both endpoints", () => {
    expect(pagesInRange(1, 1)).toBe(1);
    expect(pagesInRange(143, 160)).toBe(18);
  });
});

describe("clampPage", () => {
  it("rejects nonsense input", () => {
    expect(clampPage(Number.NaN, 380)).toBe(0);
    expect(clampPage(-5, 380)).toBe(0);
    expect(clampPage(12.7, 380)).toBe(12);
  });
});

describe("isStale", () => {
  const now = new Date("2026-08-24T12:00:00Z");

  it("flags a book untouched for over two weeks", () => {
    expect(isStale(new Date("2026-08-01T12:00:00Z"), now)).toBe(true);
  });

  it("leaves a recently read book alone", () => {
    expect(isStale(new Date("2026-08-20T12:00:00Z"), now)).toBe(false);
  });

  it("says nothing about a book never opened", () => {
    expect(isStale(null, now)).toBe(false);
  });
});
