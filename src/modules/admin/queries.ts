import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { book, readingSession, session, user } from "@/db/schema";
import { ADMIN_ROLES } from "@/modules/admin/permissions";

export type PlatformMetrics = {
  totalUsers: number;
  staff: number;
  banned: number;
  newUsersThisWeek: number;
  totalBooks: number;
  activeBooks: number;
  totalSessions: number;
  pagesLogged: number;
};

export async function getPlatformMetrics(now = new Date()): Promise<PlatformMetrics> {
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [[users], [staff], [banned], [recent], [books], [active], [sessions]] =
    await Promise.all([
      db.select({ n: count() }).from(user),
      db
        .select({ n: count() })
        .from(user)
        .where(inArray(user.role, [...ADMIN_ROLES])),
      db.select({ n: count() }).from(user).where(eq(user.banned, true)),
      db.select({ n: count() }).from(user).where(gte(user.createdAt, weekAgo)),
      db.select({ n: count() }).from(book),
      db.select({ n: count() }).from(book).where(eq(book.status, "reading")),
      db
        .select({
          n: count(),
          pages: sql<number>`coalesce(sum(${readingSession.pagesRead}), 0)::int`,
        })
        .from(readingSession),
    ]);

  return {
    totalUsers: users?.n ?? 0,
    staff: staff?.n ?? 0,
    banned: banned?.n ?? 0,
    newUsersThisWeek: recent?.n ?? 0,
    totalBooks: books?.n ?? 0,
    activeBooks: active?.n ?? 0,
    totalSessions: sessions?.n ?? 0,
    pagesLogged: sessions?.pages ?? 0,
  };
}

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  emailVerified: boolean;
  createdAt: Date;
  bookCount: number;
  pagesLogged: number;
  lastReadAt: Date | null;
};

/**
 * The user table for the back office.
 *
 * Activity is pulled in via two pre-aggregated subqueries rather than joining
 * `book` and `reading_session` directly. Joining both would fan out — each book
 * row multiplied by each session row — and silently inflate the page totals.
 *
 * (Correlated subqueries were the first attempt; Drizzle renders the outer
 * column unqualified inside them, so Postgres bound `"id"` to `book.id` and
 * failed with `operator does not exist: text = uuid`.)
 */
export async function listPlatformUsers({
  search,
  limit = 50,
  offset = 0,
}: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ users: PlatformUser[]; total: number }> {
  const term = search?.trim();
  const where = term
    ? or(ilike(user.name, `%${term}%`), ilike(user.email, `%${term}%`))
    : undefined;

  const books = db
    .select({
      userId: book.userId,
      bookCount: count().as("book_count"),
    })
    .from(book)
    .groupBy(book.userId)
    .as("books");

  const sessions = db
    .select({
      userId: readingSession.userId,
      pagesLogged: sql<number>`coalesce(sum(${readingSession.pagesRead}), 0)::int`.as(
        "pages_logged",
      ),
      // A raw aggregate bypasses Drizzle's column mapping, so this arrives as
      // a string and has to be revived below — otherwise formatRelative() gets
      // a string and throws "getTime is not a function".
      lastReadAt: sql<string | null>`max(${readingSession.readAt})`.as("last_read_at"),
    })
    .from(readingSession)
    .groupBy(readingSession.userId)
    .as("sessions");

  const [rows, [totals]] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        bookCount: sql<number>`coalesce(${books.bookCount}, 0)::int`,
        pagesLogged: sql<number>`coalesce(${sessions.pagesLogged}, 0)::int`,
        lastReadAt: sessions.lastReadAt,
      })
      .from(user)
      .leftJoin(books, eq(books.userId, user.id))
      .leftJoin(sessions, eq(sessions.userId, user.id))
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ n: count() }).from(user).where(where),
  ]);

  return {
    users: rows.map((row) => ({
      ...row,
      lastReadAt: row.lastReadAt ? new Date(row.lastReadAt) : null,
    })),
    total: totals?.n ?? 0,
  };
}

/** Sessions currently open for one account, newest first. */
export async function countActiveSessions(userId: string, now = new Date()) {
  const [row] = await db
    .select({ n: count() })
    .from(session)
    .where(and(eq(session.userId, userId), gte(session.expiresAt, now)));
  return row?.n ?? 0;
}
