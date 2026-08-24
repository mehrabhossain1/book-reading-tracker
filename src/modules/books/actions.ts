"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { book } from "@/db/schema";
import { ActionError, authedAction } from "@/lib/safe-action";
import { clampPage } from "@/modules/books/progress";
import {
  createBookSchema,
  deleteBookSchema,
  setBookStatusSchema,
  updateBookSchema,
} from "@/modules/books/schema";

function revalidateBook(bookId?: string) {
  revalidatePath("/library");
  revalidatePath("/stats");
  if (bookId) revalidatePath(`/books/${bookId}`);
}

export const createBook = authedAction(createBookSchema, async (input, { user }) => {
  const [created] = await db
    .insert(book)
    .values({
      userId: user.id,
      title: input.title,
      author: input.author,
      coverUrl: input.coverUrl,
      totalPages: input.totalPages,
      status: input.status,
      startedAt: input.status === "reading" ? new Date() : null,
    })
    .returning({ id: book.id });

  revalidateBook(created.id);
  return { bookId: created.id };
});

export const updateBook = authedAction(updateBookSchema, async (input, { user }) => {
  const [existing] = await db
    .select({ currentPage: book.currentPage })
    .from(book)
    .where(and(eq(book.userId, user.id), eq(book.id, input.bookId)))
    .limit(1);

  if (!existing) throw new ActionError("That book is no longer in your library.");

  // Shrinking the page count must not leave the bookmark past the last page.
  const [updated] = await db
    .update(book)
    .set({
      title: input.title,
      author: input.author,
      coverUrl: input.coverUrl,
      totalPages: input.totalPages,
      status: input.status,
      currentPage: clampPage(existing.currentPage, input.totalPages),
    })
    .where(and(eq(book.userId, user.id), eq(book.id, input.bookId)))
    .returning({ id: book.id });

  revalidateBook(updated.id);
  return { bookId: updated.id };
});

export const setBookStatus = authedAction(setBookStatusSchema, async (input, { user }) => {
  const now = new Date();
  const [existing] = await db
    .select({ totalPages: book.totalPages, startedAt: book.startedAt })
    .from(book)
    .where(and(eq(book.userId, user.id), eq(book.id, input.bookId)))
    .limit(1);

  if (!existing) throw new ActionError("That book is no longer in your library.");

  const finishing = input.status === "finished";

  const [updated] = await db
    .update(book)
    .set({
      status: input.status,
      startedAt:
        existing.startedAt ?? (input.status === "reading" || finishing ? now : null),
      finishedAt: finishing ? now : null,
      ...(finishing ? { currentPage: existing.totalPages, lastReadAt: now } : {}),
    })
    .where(and(eq(book.userId, user.id), eq(book.id, input.bookId)))
    .returning({ id: book.id });

  revalidateBook(updated.id);
  return { bookId: updated.id };
});

export const deleteBook = authedAction(deleteBookSchema, async (input, { user }) => {
  const deleted = await db
    .delete(book)
    .where(and(eq(book.userId, user.id), eq(book.id, input.bookId)))
    .returning({ id: book.id });

  if (deleted.length === 0) throw new ActionError("That book is no longer in your library.");

  revalidateBook();
  return { bookId: input.bookId };
});
