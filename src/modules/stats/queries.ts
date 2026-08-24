import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { book, readingSession } from "@/db/schema";
import { currentStreak, dayKey, lastNDays, startOfWeek } from "@/modules/stats/streak";

export type LibraryStats = {
  pagesThisWeek: number;
  streak: number;
  finishedThisYear: number;
  activeBooks: number;
  daily: { date: Date; pages: number }[];
};

export async function getLibraryStats(userId: string, now = new Date()): Promise<LibraryStats> {
  const yearStart = new Date(now.getFullYear(), 0, 1);
  // 60 days is plenty to compute both the 7-day chart and a realistic streak,
  // and small enough to aggregate in JS with correct local-time day boundaries.
  const window = new Date(now);
  window.setDate(window.getDate() - 60);

  const [sessions, [finished], [active]] = await Promise.all([
    db
      .select({ readAt: readingSession.readAt, pagesRead: readingSession.pagesRead })
      .from(readingSession)
      .where(and(eq(readingSession.userId, userId), gte(readingSession.readAt, window))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(book)
      .where(
        and(
          eq(book.userId, userId),
          eq(book.status, "finished"),
          gte(book.finishedAt, yearStart),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(book)
      .where(and(eq(book.userId, userId), eq(book.status, "reading"))),
  ]);

  const weekStart = startOfWeek(now);
  const pagesByDay = new Map<string, number>();
  let pagesThisWeek = 0;

  for (const session of sessions) {
    const key = dayKey(session.readAt);
    pagesByDay.set(key, (pagesByDay.get(key) ?? 0) + session.pagesRead);
    if (session.readAt >= weekStart) pagesThisWeek += session.pagesRead;
  }

  return {
    pagesThisWeek,
    streak: currentStreak(
      sessions.map((s) => s.readAt),
      now,
    ),
    finishedThisYear: finished?.count ?? 0,
    activeBooks: active?.count ?? 0,
    daily: lastNDays(7, now).map((date) => ({
      date,
      pages: pagesByDay.get(dayKey(date)) ?? 0,
    })),
  };
}
