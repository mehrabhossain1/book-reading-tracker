/**
 * Seeds a few books and a fortnight of reading sessions for an existing account,
 * so the library, timeline and stats screens have something real to render.
 *
 *   pnpm db:seed you@example.com
 *
 * Sign up through the UI first — this script never creates auth records.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { book, readingSession, user } from "@/db/schema";
import { pagesInRange } from "@/modules/books/progress";

const SEED_BOOKS = [
  { title: "The Power Broker", author: "Robert A. Caro", totalPages: 1246, read: 380 },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", totalPages: 499, read: 142 },
  { title: "The Pragmatic Programmer", author: "Hunt & Thomas", totalPages: 352, read: 96 },
  { title: "Pride and Prejudice", author: "Jane Austen", totalPages: 279, read: 279 },
];

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm db:seed <email of an existing account>");
    process.exit(1);
  }

  const [owner] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (!owner) {
    console.error(`No account found for ${email}. Sign up through the app first.`);
    process.exit(1);
  }

  const now = new Date();

  for (const [index, entry] of SEED_BOOKS.entries()) {
    const finished = entry.read >= entry.totalPages;
    const lastReadAt = new Date(now.getTime() - index * 2 * 24 * 60 * 60 * 1000);
    const startedAt = new Date(now.getTime() - (index + 3) * 7 * 24 * 60 * 60 * 1000);

    const [created] = await db
      .insert(book)
      .values({
        userId: owner.id,
        title: entry.title,
        author: entry.author,
        totalPages: entry.totalPages,
        currentPage: entry.read,
        status: finished ? "finished" : "reading",
        startedAt,
        finishedAt: finished ? lastReadAt : null,
        lastReadAt,
      })
      .returning({ id: book.id });

    // Split the progress into three plausible sittings.
    const chunk = Math.max(1, Math.floor(entry.read / 3));
    let cursor = 1;
    for (let session = 0; session < 3 && cursor <= entry.read; session += 1) {
      const endPage = session === 2 ? entry.read : Math.min(entry.read, cursor + chunk - 1);
      await db.insert(readingSession).values({
        bookId: created.id,
        userId: owner.id,
        startPage: cursor,
        endPage,
        pagesRead: pagesInRange(cursor, endPage),
        readAt: new Date(lastReadAt.getTime() - (2 - session) * 3 * 24 * 60 * 60 * 1000),
      });
      cursor = endPage + 1;
    }

    console.log(`  seeded ${entry.title}`);
  }

  console.log(`\nSeeded ${SEED_BOOKS.length} books for ${email}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
