import { sql } from "drizzle-orm";

import { bookEdition } from "@/db/schema";
import type { Db } from "@/db";
import { editionKey } from "@/modules/catalogue/normalize";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Find the catalogue entry for this work, or contribute it.
 *
 * A single INSERT ... ON CONFLICT: two people adding the same book at the same
 * moment can't create duplicate rows, and the usage counter is incremented in
 * the same statement rather than read-then-write.
 *
 * The conflict target is the (normalized_title, normalized_author) unique
 * index — the identity rule lives in normalize.ts.
 */
export async function findOrCreateEdition(
  tx: Tx,
  input: {
    title: string;
    author: string | null;
    totalPages: number;
    coverUrl: string | null;
    userId: string;
  },
): Promise<string> {
  const key = editionKey(input.title, input.author);

  const [row] = await tx
    .insert(bookEdition)
    .values({
      title: input.title.trim(),
      author: input.author,
      totalPages: input.totalPages,
      coverUrl: input.coverUrl,
      createdBy: input.userId,
      // Left at 0 deliberately: the book_edition_usage_sync trigger counts the
      // shelf row that follows. Incrementing here too would double-count.
      usageCount: 0,
      ...key,
    })
    .onConflictDoUpdate({
      target: [bookEdition.normalizedTitle, bookEdition.normalizedAuthor],
      set: {
        // Fill in details the original contributor left blank, but never
        // overwrite what is already there — the first contributor's data wins.
        coverUrl: sql`coalesce(${bookEdition.coverUrl}, ${input.coverUrl ?? null})`,
        author: sql`coalesce(${bookEdition.author}, ${input.author ?? null})`,
        updatedAt: new Date(),
      },
    })
    .returning({ id: bookEdition.id });

  return row.id;
}
