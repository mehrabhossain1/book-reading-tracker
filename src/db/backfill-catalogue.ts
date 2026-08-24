/**
 * Seeds the shared catalogue from books that already exist on shelves.
 *
 *   pnpm db:backfill-catalogue
 *
 * Idempotent: only touches books with no edition link, and the upsert collapses
 * duplicates by normalised identity, so running it twice changes nothing.
 */
import { count, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { book, bookEdition } from "@/db/schema";
import { findOrCreateEdition } from "@/modules/catalogue/upsert";

async function main() {
  const orphans = await db
    .select({
      id: book.id,
      userId: book.userId,
      title: book.title,
      author: book.author,
      totalPages: book.totalPages,
      coverUrl: book.coverUrl,
    })
    .from(book)
    .where(isNull(book.editionId));

  console.log(`${orphans.length} shelf book(s) with no catalogue link.`);

  for (const row of orphans) {
    await db.transaction(async (tx) => {
      const editionId = await findOrCreateEdition(tx, {
        title: row.title,
        author: row.author,
        totalPages: row.totalPages,
        coverUrl: row.coverUrl,
        userId: row.userId,
      });
      await tx.update(book).set({ editionId }).where(eq(book.id, row.id));
    });
    console.log(`  linked "${row.title}"`);
  }

  const [total] = await db.select({ n: count() }).from(bookEdition);
  console.log(`\nCatalogue now holds ${total?.n ?? 0} edition(s).`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
