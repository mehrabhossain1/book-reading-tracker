"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { book } from "@/db/schema";
import { ActionError, authedAction } from "@/lib/safe-action";
import { clampPage } from "@/modules/books/progress";
import { editionKey } from "@/modules/catalogue/normalize";
import { findOrCreateEdition } from "@/modules/catalogue/upsert";
import {
  createBookSchema,
  deleteBookSchema,
  setBookStatusSchema,
  updateBookSchema,
} from "@/modules/books/schema";

/**
 * Library, detail and stats are kept fresh on the client by TanStack Query, so
 * the hot paths (status changes, deletes) no longer revalidate server pages.
 *
 * Two things still need the server told:
 *  - the shared catalogue search cache, whenever a write may have added an
 *    edition. `expire: 0` rather than the "max" profile: stale-while-revalidate
 *    would hide a just-added book from the very next person searching for it.
 *    (The single-argument revalidateTag(tag) is deprecated in this Next.)
 *  - the edit form, which renders server-side from the database. With the 30s
 *    client router cache, revisiting it right after a save would otherwise show
 *    the pre-save values.
 */
function revalidateCatalogue() {
  revalidateTag("catalogue", { expire: 0 });
}

export const createBook = authedAction(createBookSchema, async (input, { user }) => {
  const created = await db.transaction(async (tx) => {
    // Every book added anywhere joins the shared catalogue, whether it came
    // from a suggestion or was typed from scratch. That is what makes the
    // catalogue grow without anyone curating it.
    const editionId = await findOrCreateEdition(tx, {
      title: input.title,
      author: input.author,
      totalPages: input.totalPages,
      coverUrl: input.coverUrl,
      userId: user.id,
    });

    const [row] = await tx
      .insert(book)
      .values({
        userId: user.id,
        editionId,
        title: input.title,
        author: input.author,
        coverUrl: input.coverUrl,
        totalPages: input.totalPages,
        status: input.status,
        startedAt: input.status === "reading" ? new Date() : null,
      })
      .returning({ id: book.id });

    return row;
  });

  revalidateCatalogue();
  return { bookId: created.id };
});

export const updateBook = authedAction(updateBookSchema, async (input, { user }) => {
  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        currentPage: book.currentPage,
        title: book.title,
        author: book.author,
        editionId: book.editionId,
      })
      .from(book)
      .where(and(eq(book.userId, user.id), eq(book.id, input.bookId)))
      .limit(1);

    if (!existing) throw new ActionError("That book is no longer in your library.");

    // If the edit changed which work this is, move the catalogue link with it —
    // releasing the old entry first so usage counts stay honest.
    const before = editionKey(existing.title, existing.author);
    const after = editionKey(input.title, input.author);
    const identityChanged =
      before.normalizedTitle !== after.normalizedTitle ||
      before.normalizedAuthor !== after.normalizedAuthor;

    // The usage counter follows automatically — a trigger on `book` watches
    // edition_id and reconciles both sides.
    let editionId = existing.editionId;
    if (identityChanged || !editionId) {
      editionId = await findOrCreateEdition(tx, {
        title: input.title,
        author: input.author,
        totalPages: input.totalPages,
        coverUrl: input.coverUrl,
        userId: user.id,
      });
    }

    // Shrinking the page count must not leave the bookmark past the last page.
    const [row] = await tx
      .update(book)
      .set({
        editionId,
        title: input.title,
        author: input.author,
        coverUrl: input.coverUrl,
        totalPages: input.totalPages,
        status: input.status,
        currentPage: clampPage(existing.currentPage, input.totalPages),
      })
      .where(and(eq(book.userId, user.id), eq(book.id, input.bookId)))
      .returning({ id: book.id });

    return row;
  });

  revalidateCatalogue();
  revalidatePath(`/books/${updated.id}/edit`);
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

  return { bookId: updated.id };
});

export const deleteBook = authedAction(deleteBookSchema, async (input, { user }) => {
  // The catalogue entry itself stays — someone else may be reading it, and it
  // remains a useful suggestion regardless. Its usage count drops via trigger.
  const deleted = await db
    .delete(book)
    .where(and(eq(book.userId, user.id), eq(book.id, input.bookId)))
    .returning({ id: book.id });

  if (deleted.length === 0) throw new ActionError("That book is no longer in your library.");

  return { bookId: input.bookId };
});
