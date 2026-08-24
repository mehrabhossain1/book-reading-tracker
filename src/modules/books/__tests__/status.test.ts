import { describe, expect, it } from "vitest";

import { BOOK_STATUSES } from "@/db/schema";
import { BOOK_STATUS_META, STATUS_ORDER, isBookStatus, statusLabel } from "../status";

describe("book status metadata", () => {
  /**
   * The bug this guards: `want_to_read` and `abandoned` were selectable in the
   * add-book form but had no library tab, so creating one made the book
   * unreachable. Every status must have somewhere to live.
   */
  it("gives every status a tab", () => {
    expect([...STATUS_ORDER].sort()).toEqual([...BOOK_STATUSES].sort());
  });

  it("lists each status exactly once", () => {
    expect(new Set(STATUS_ORDER).size).toBe(STATUS_ORDER.length);
  });

  it("gives every status a label and an empty state", () => {
    for (const status of BOOK_STATUSES) {
      const meta = BOOK_STATUS_META[status];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.emptyTitle.length).toBeGreaterThan(0);
      expect(meta.emptyBody.length).toBeGreaterThan(0);
    }
  });

  it("opens on Reading", () => {
    expect(STATUS_ORDER[0]).toBe("reading");
  });

  it("labels statuses for humans, not for the database", () => {
    expect(statusLabel("want_to_read")).toBe("Want to read");
  });
});

describe("isBookStatus", () => {
  it("accepts real statuses", () => {
    expect(isBookStatus("want_to_read")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isBookStatus("READING")).toBe(false);
    expect(isBookStatus("nonsense")).toBe(false);
    expect(isBookStatus(undefined)).toBe(false);
    expect(isBookStatus(7)).toBe(false);
  });
});
