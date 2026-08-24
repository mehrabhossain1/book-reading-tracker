"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { book, readingSession } from "@/db/schema";
import { ActionError, authedAction } from "@/lib/safe-action";
import { advanceCurrentPage, pagesInRange } from "@/modules/books/progress";
import { logProgressSchema } from "@/modules/progress/schema";

/**
 * The core write of the whole product.
 *
 * The session log and the book's bookmark are written in ONE transaction —
 * a half-applied progress update would either lose pages from the history or
 * leave the bookmark ahead of what was actually logged.
 */
export const logProgress = authedAction(logProgressSchema, async (input, { user }) => {
  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(book)
      .where(and(eq(book.userId, user.id), eq(book.id, input.bookId)))
      .for("update")
      .limit(1);

    if (!current) throw new ActionError("That book is no longer in your library.");

    const finished = input.finished;
    const endPage = finished ? current.totalPages : input.endPage;
    const startPage = Math.min(input.startPage, endPage);

    if (endPage > current.totalPages) {
      throw new ActionError(`This book only has ${current.totalPages} pages.`);
    }

    const now = new Date();

    await tx.insert(readingSession).values({
      bookId: current.id,
      userId: user.id,
      startPage,
      endPage,
      pagesRead: pagesInRange(startPage, endPage),
      note: input.note,
      readAt: now,
    });

    const [updated] = await tx
      .update(book)
      .set({
        currentPage: finished
          ? current.totalPages
          : advanceCurrentPage(current.currentPage, endPage, current.totalPages),
        lastReadAt: now,
        startedAt: current.startedAt ?? now,
        status: finished ? "finished" : current.status === "finished" ? "reading" : "reading",
        finishedAt: finished ? now : null,
      })
      .where(and(eq(book.userId, user.id), eq(book.id, current.id)))
      .returning({ id: book.id, currentPage: book.currentPage, status: book.status });

    return updated;
  });

  revalidatePath("/library");
  revalidatePath("/stats");
  revalidatePath(`/books/${input.bookId}`);

  return result;
});
