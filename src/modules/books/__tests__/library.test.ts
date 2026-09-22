import { describe, expect, it } from "vitest";

import type { BookDTO } from "../dto";
import {
  applyProgress,
  applyStatus,
  booksWithStatus,
  continueReading,
  countByStatus,
  optimisticSession,
  removeBook,
  replaceBook,
  sortLibrary,
} from "../library";

const NOW = "2026-09-22T10:00:00.000Z";

function book(overrides: Partial<BookDTO> = {}): BookDTO {
  return {
    id: "b1",
    editionId: null,
    title: "Middlemarch",
    author: "George Eliot",
    coverUrl: null,
    totalPages: 900,
    status: "reading",
    currentPage: 100,
    startedAt: "2026-09-01T09:00:00.000Z",
    finishedAt: null,
    lastReadAt: "2026-09-10T09:00:00.000Z",
    createdAt: "2026-09-01T09:00:00.000Z",
    ...overrides,
  };
}

describe("sortLibrary", () => {
  it("puts the most recently read first and never-read last", () => {
    const sorted = sortLibrary([
      book({ id: "old", lastReadAt: "2026-09-01T00:00:00.000Z" }),
      book({ id: "never", lastReadAt: null }),
      book({ id: "new", lastReadAt: "2026-09-20T00:00:00.000Z" }),
    ]);
    expect(sorted.map((b) => b.id)).toEqual(["new", "old", "never"]);
  });

  it("breaks ties on the newest added", () => {
    const sorted = sortLibrary([
      book({ id: "a", lastReadAt: null, createdAt: "2026-09-01T00:00:00.000Z" }),
      book({ id: "b", lastReadAt: null, createdAt: "2026-09-05T00:00:00.000Z" }),
    ]);
    expect(sorted.map((b) => b.id)).toEqual(["b", "a"]);
  });

  it("does not mutate its input", () => {
    const input = [book({ id: "x", lastReadAt: null }), book({ id: "y" })];
    const copy = [...input];
    sortLibrary(input);
    expect(input).toEqual(copy);
  });
});

describe("derivations", () => {
  const shelf = [
    book({ id: "r1", status: "reading", lastReadAt: "2026-09-02T00:00:00.000Z" }),
    book({ id: "r2", status: "reading", lastReadAt: "2026-09-09T00:00:00.000Z" }),
    book({ id: "p", status: "paused" }),
    book({ id: "f", status: "finished", lastReadAt: "2026-09-21T00:00:00.000Z" }),
  ];

  it("counts every status", () => {
    expect(countByStatus(shelf)).toEqual({ reading: 2, paused: 1, finished: 1 });
  });

  it("filters one tab", () => {
    expect(booksWithStatus(shelf, "reading").map((b) => b.id)).toEqual(["r1", "r2"]);
  });

  it("continues the most recent *reading* book, not a more recent finished one", () => {
    expect(continueReading(shelf)?.id).toBe("r2");
  });

  it("has nothing to continue on an empty shelf", () => {
    expect(continueReading([])).toBeNull();
  });
});

describe("applyProgress mirrors the server", () => {
  it("moves the bookmark forward and stamps the read time", () => {
    const next = applyProgress(book(), { startPage: 101, endPage: 140, finished: false }, NOW);
    expect(next.currentPage).toBe(140);
    expect(next.lastReadAt).toBe(NOW);
    expect(next.status).toBe("reading");
  });

  it("never moves the bookmark backwards on a re-read", () => {
    const next = applyProgress(book({ currentPage: 300 }), { startPage: 10, endPage: 20, finished: false }, NOW);
    expect(next.currentPage).toBe(300);
  });

  it("finishing jumps to the last page and stamps finishedAt", () => {
    const next = applyProgress(book(), { startPage: 101, endPage: 101, finished: true }, NOW);
    expect(next.currentPage).toBe(900);
    expect(next.status).toBe("finished");
    expect(next.finishedAt).toBe(NOW);
  });

  it("promotes a queued book to reading and starts it", () => {
    const next = applyProgress(
      book({ status: "want_to_read", startedAt: null, currentPage: 0 }),
      { startPage: 1, endPage: 30, finished: false },
      NOW,
    );
    expect(next.status).toBe("reading");
    expect(next.startedAt).toBe(NOW);
  });

  it("keeps the original start date", () => {
    const next = applyProgress(book(), { startPage: 101, endPage: 110, finished: false }, NOW);
    expect(next.startedAt).toBe("2026-09-01T09:00:00.000Z");
  });

  it("re-logging a finished book puts it back to reading", () => {
    const next = applyProgress(
      book({ status: "finished", finishedAt: NOW, currentPage: 900 }),
      { startPage: 1, endPage: 50, finished: false },
      NOW,
    );
    expect(next.status).toBe("reading");
    expect(next.finishedAt).toBeNull();
  });
});

describe("applyStatus mirrors the server", () => {
  it("finishing fills the book and stamps both dates", () => {
    const next = applyStatus(book(), "finished", NOW);
    expect(next).toMatchObject({ status: "finished", currentPage: 900, finishedAt: NOW, lastReadAt: NOW });
  });

  it("pausing keeps the bookmark and clears finishedAt", () => {
    const next = applyStatus(book({ currentPage: 250 }), "paused", NOW);
    expect(next).toMatchObject({ status: "paused", currentPage: 250, finishedAt: null });
  });

  it("starting a never-started book stamps startedAt", () => {
    expect(applyStatus(book({ startedAt: null }), "reading", NOW).startedAt).toBe(NOW);
  });

  it("queueing a never-started book leaves startedAt empty", () => {
    expect(applyStatus(book({ startedAt: null }), "want_to_read", NOW).startedAt).toBeNull();
  });
});

describe("optimisticSession", () => {
  it("counts both endpoints", () => {
    const s = optimisticSession(book(), { startPage: 101, endPage: 120, finished: false }, NOW);
    expect(s).toMatchObject({ startPage: 101, endPage: 120, pagesRead: 20 });
  });

  it("logs through to the last page when finishing", () => {
    const s = optimisticSession(book(), { startPage: 850, endPage: 850, finished: true }, NOW);
    expect(s).toMatchObject({ startPage: 850, endPage: 900, pagesRead: 51 });
  });

  it("has an id that can never collide with a real uuid", () => {
    expect(optimisticSession(book(), { startPage: 1, endPage: 2, finished: false }, NOW).id).toMatch(
      /^optimistic-/,
    );
  });

  it("drops a blank note", () => {
    expect(
      optimisticSession(book(), { startPage: 1, endPage: 2, finished: false, note: "   " }, NOW).note,
    ).toBeNull();
  });
});

describe("replaceBook / removeBook", () => {
  it("re-sorts after an update, so a just-read book jumps to the top", () => {
    const shelf = [
      book({ id: "a", lastReadAt: "2026-09-20T00:00:00.000Z" }),
      book({ id: "b", lastReadAt: "2026-09-01T00:00:00.000Z" }),
    ];
    const updated = replaceBook(shelf, { ...shelf[1], lastReadAt: NOW });
    expect(updated.map((b) => b.id)).toEqual(["b", "a"]);
  });

  it("removes exactly one book", () => {
    expect(removeBook([book({ id: "a" }), book({ id: "b" })], "a").map((b) => b.id)).toEqual(["b"]);
  });
});
