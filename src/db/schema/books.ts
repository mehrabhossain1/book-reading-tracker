import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const bookStatusEnum = pgEnum("book_status", [
  "want_to_read",
  "reading",
  "paused",
  "finished",
  "abandoned",
]);

export const BOOK_STATUSES = bookStatusEnum.enumValues;
export type BookStatus = (typeof BOOK_STATUSES)[number];

/**
 * A book on one person's shelf.
 *
 * `currentPage` is denormalised on purpose: the library screen has to render a
 * progress bar per row, and aggregating `reading_session` for each row would
 * make the hot path O(sessions). It is only ever written in the same
 * transaction as the session that moved it — see modules/progress/actions.ts.
 */
export const book = pgTable(
  "book",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    author: text("author"),
    coverUrl: text("cover_url"),
    totalPages: integer("total_pages").notNull(),

    status: bookStatusEnum("status").notNull().default("reading"),
    currentPage: integer("current_page").notNull().default(0),

    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    /** Drives library ordering, so a neglected book visibly sinks. */
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // Every list view is "this user's books, filtered by status".
    index("book_user_status_idx").on(t.userId, t.status),
    index("book_user_last_read_idx").on(t.userId, t.lastReadAt.desc()),
    check("book_total_pages_positive", sql`${t.totalPages} > 0`),
    check(
      "book_current_page_in_range",
      sql`${t.currentPage} >= 0 AND ${t.currentPage} <= ${t.totalPages}`,
    ),
  ],
);

/**
 * Append-only log of reading. Never updated in place — a correction is a new
 * row, so the history stays honest and every future stat (streaks, pages/week,
 * year-in-review) is a query over data we are already collecting.
 */
export const readingSession = pgTable(
  "reading_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => book.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    /** Inclusive page range covered by this sitting. */
    startPage: integer("start_page").notNull(),
    endPage: integer("end_page").notNull(),
    /** Stored, not derived, so weekly totals are a plain indexed SUM. */
    pagesRead: integer("pages_read").notNull(),

    note: text("note"),
    readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("reading_session_book_read_at_idx").on(t.bookId, t.readAt.desc()),
    index("reading_session_user_read_at_idx").on(t.userId, t.readAt.desc()),
    check("reading_session_range_valid", sql`${t.endPage} >= ${t.startPage}`),
    check("reading_session_start_positive", sql`${t.startPage} >= 1`),
    check(
      "reading_session_pages_read_matches",
      sql`${t.pagesRead} = ${t.endPage} - ${t.startPage} + 1`,
    ),
  ],
);

export const bookRelations = relations(book, ({ one, many }) => ({
  owner: one(user, { fields: [book.userId], references: [user.id] }),
  sessions: many(readingSession),
}));

export const readingSessionRelations = relations(readingSession, ({ one }) => ({
  book: one(book, { fields: [readingSession.bookId], references: [book.id] }),
  owner: one(user, { fields: [readingSession.userId], references: [user.id] }),
}));

export type Book = typeof book.$inferSelect;
export type NewBook = typeof book.$inferInsert;
export type ReadingSession = typeof readingSession.$inferSelect;
export type NewReadingSession = typeof readingSession.$inferInsert;
