import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { book, readingSession, type BookStatus } from "@/db/schema";

/**
 * Every query in this file is scoped by `userId`. Not "usually" — every one.
 * That is the multi-tenant boundary, enforced here rather than in the UI.
 */

export async function listBooks(userId: string, status?: BookStatus) {
  return db
    .select()
    .from(book)
    .where(status ? and(eq(book.userId, userId), eq(book.status, status)) : eq(book.userId, userId))
    .orderBy(sql`${book.lastReadAt} desc nulls last`, desc(book.createdAt));
}

export async function countBooksByStatus(userId: string) {
  const rows = await db
    .select({ status: book.status, count: sql<number>`count(*)::int` })
    .from(book)
    .where(eq(book.userId, userId))
    .groupBy(book.status);

  return Object.fromEntries(rows.map((row) => [row.status, row.count])) as Partial<
    Record<BookStatus, number>
  >;
}

export async function getBook(userId: string, bookId: string) {
  const [row] = await db
    .select()
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.id, bookId)))
    .limit(1);
  return row ?? null;
}

export async function getBookSessions(userId: string, bookId: string, limit = 100) {
  return db
    .select()
    .from(readingSession)
    .where(and(eq(readingSession.userId, userId), eq(readingSession.bookId, bookId)))
    .orderBy(desc(readingSession.readAt))
    .limit(limit);
}

/** The book behind the sticky "Continue reading" bar. */
export async function getMostRecentlyRead(userId: string) {
  const [row] = await db
    .select()
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.status, "reading")))
    .orderBy(sql`${book.lastReadAt} desc nulls last`, desc(book.createdAt))
    .limit(1);
  return row ?? null;
}
