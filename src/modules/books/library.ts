/**
 * Pure shelf logic shared by the UI and its optimistic updates.
 *
 * `applyProgress` and `applyStatus` are client mirrors of the server rules in
 * modules/progress/actions.ts and modules/books/actions.ts. If the two ever
 * diverge, the optimistic UI shows the wrong thing for a moment and the refetch
 * corrects it — so the tests in __tests__/library.test.ts pin them to the same
 * behaviour rather than trusting them to stay in step.
 */
import type { BookStatus } from "@/db/schema";
import type { BookDTO, SessionDTO } from "@/modules/books/dto";
import { advanceCurrentPage, pagesInRange } from "@/modules/books/progress";

/**
 * Same order as the server's listBooks: most recently read first, never-read
 * last, then newest added. ISO strings from toISOString() are fixed-width UTC,
 * so plain string comparison is chronological.
 */
export function sortLibrary(books: BookDTO[]): BookDTO[] {
  return [...books].sort((a, b) => {
    if (a.lastReadAt !== b.lastReadAt) {
      if (!a.lastReadAt) return 1;
      if (!b.lastReadAt) return -1;
      return b.lastReadAt.localeCompare(a.lastReadAt);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function booksWithStatus(books: BookDTO[], status: BookStatus): BookDTO[] {
  return books.filter((book) => book.status === status);
}

export function countByStatus(books: BookDTO[]): Partial<Record<BookStatus, number>> {
  const counts: Partial<Record<BookStatus, number>> = {};
  for (const book of books) counts[book.status] = (counts[book.status] ?? 0) + 1;
  return counts;
}

/** The book behind the "Continue reading" bar: the most recent one still being read. */
export function continueReading(books: BookDTO[]): BookDTO | null {
  return sortLibrary(books).find((book) => book.status === "reading") ?? null;
}

export type ProgressInput = {
  startPage: number;
  endPage: number;
  finished: boolean;
  note?: string | null;
};

/** Mirror of logProgress: the bookmark only moves forward; logging always means "reading". */
export function applyProgress(book: BookDTO, input: ProgressInput, nowIso: string): BookDTO {
  const endPage = input.finished ? book.totalPages : input.endPage;

  return {
    ...book,
    currentPage: input.finished
      ? book.totalPages
      : advanceCurrentPage(book.currentPage, endPage, book.totalPages),
    lastReadAt: nowIso,
    startedAt: book.startedAt ?? nowIso,
    status: input.finished ? "finished" : "reading",
    finishedAt: input.finished ? nowIso : null,
  };
}

/** Mirror of setBookStatus. */
export function applyStatus(book: BookDTO, status: BookStatus, nowIso: string): BookDTO {
  const finishing = status === "finished";

  return {
    ...book,
    status,
    startedAt: book.startedAt ?? (status === "reading" || finishing ? nowIso : null),
    finishedAt: finishing ? nowIso : null,
    ...(finishing ? { currentPage: book.totalPages, lastReadAt: nowIso } : {}),
  };
}

/** The history row to show before the server has confirmed it. */
export function optimisticSession(book: BookDTO, input: ProgressInput, nowIso: string): SessionDTO {
  const endPage = input.finished ? book.totalPages : input.endPage;
  const startPage = Math.min(input.startPage, endPage);

  return {
    id: `optimistic-${nowIso}`,
    bookId: book.id,
    startPage,
    endPage,
    pagesRead: pagesInRange(startPage, endPage),
    note: input.note?.trim() ? input.note.trim() : null,
    readAt: nowIso,
  };
}

export function replaceBook(books: BookDTO[], updated: BookDTO): BookDTO[] {
  return sortLibrary(books.map((book) => (book.id === updated.id ? updated : book)));
}

export function removeBook(books: BookDTO[], bookId: string): BookDTO[] {
  return books.filter((book) => book.id !== bookId);
}
