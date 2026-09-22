import type { Book, BookStatus, ReadingSession } from "@/db/schema";

/**
 * Wire format for a shelf book.
 *
 * Dates are ISO-8601 strings, never Date objects: JSON has no Date type, so a
 * value fetched by the client would be a string while the same value rendered
 * on the server was a Date — and code that works in one path crashes in the
 * other. One shape everywhere. ISO with a `T` and `Z` is also the only format
 * Safari's Date parser accepts reliably ("2026-08-24 13:48:36" is Invalid Date
 * in Safari, fine in Chrome).
 */
export type BookDTO = {
  id: string;
  editionId: string | null;
  title: string;
  author: string | null;
  coverUrl: string | null;
  totalPages: number;
  status: BookStatus;
  currentPage: number;
  startedAt: string | null;
  finishedAt: string | null;
  lastReadAt: string | null;
  createdAt: string;
};

export type SessionDTO = {
  id: string;
  bookId: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  note: string | null;
  readAt: string;
};

export type LibraryDTO = { books: BookDTO[] };
export type BookDetailDTO = { book: BookDTO; sessions: SessionDTO[] };

export type StatsDTO = {
  pagesThisWeek: number;
  streak: number;
  finishedThisYear: number;
  activeBooks: number;
  /** `label` is computed where the day was bucketed, so the two can't disagree. */
  daily: { date: string; label: string; pages: number }[];
};

const iso = (value: Date | null) => (value ? value.toISOString() : null);

export function toBookDTO(book: Book): BookDTO {
  return {
    id: book.id,
    editionId: book.editionId,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    totalPages: book.totalPages,
    status: book.status,
    currentPage: book.currentPage,
    startedAt: iso(book.startedAt),
    finishedAt: iso(book.finishedAt),
    lastReadAt: iso(book.lastReadAt),
    createdAt: book.createdAt.toISOString(),
  };
}

export function toSessionDTO(session: ReadingSession): SessionDTO {
  return {
    id: session.id,
    bookId: session.bookId,
    startPage: session.startPage,
    endPage: session.endPage,
    pagesRead: session.pagesRead,
    note: session.note,
    readAt: session.readAt.toISOString(),
  };
}
