import "server-only";

import type { BookDetailDTO, LibraryDTO, StatsDTO } from "@/modules/books/dto";
import { toBookDTO, toSessionDTO } from "@/modules/books/dto";
import { getBook, getBookSessions, listBooks } from "@/modules/books/queries";
import { getLibraryStats } from "@/modules/stats/queries";

/**
 * The single source for each payload. Server components call these to
 * prefetch; the JSON route handlers call the same functions. Because both paths
 * go through one function, the hydrated data and the refetched data can never
 * differ in shape.
 */

/**
 * The whole shelf in one query. A reader has tens of books, so filtering tabs
 * on the client is instant — and it replaces the previous list + counts +
 * "most recently read" trio with a single indexed scan on (user_id, last_read_at).
 */
export async function loadLibrary(userId: string): Promise<LibraryDTO> {
  const books = await listBooks(userId);
  return { books: books.map(toBookDTO) };
}

/** Book and history in parallel — they used to run one after the other. */
export async function loadBookDetail(
  userId: string,
  bookId: string,
): Promise<BookDetailDTO | null> {
  const [book, sessions] = await Promise.all([
    getBook(userId, bookId),
    getBookSessions(userId, bookId),
  ]);
  if (!book) return null;
  return { book: toBookDTO(book), sessions: sessions.map(toSessionDTO) };
}

const WEEKDAY = new Intl.DateTimeFormat("en", { weekday: "short" });

export async function loadStats(userId: string): Promise<StatsDTO> {
  const stats = await getLibraryStats(userId);
  return {
    ...stats,
    daily: stats.daily.map((day) => ({
      date: day.date.toISOString(),
      // Labelled here, in the same timezone the day was bucketed in. Labelling
      // in the browser instead would name the wrong weekday for anyone west of
      // the server, and differ between server render and hydration.
      label: WEEKDAY.format(day.date).slice(0, 2),
      pages: day.pages,
    })),
  };
}
