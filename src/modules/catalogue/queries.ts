import "server-only";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { book, bookEdition } from "@/db/schema";
import { TRIGRAM_MIN_LENGTH, normalizeTitle } from "@/modules/catalogue/normalize";

export type EditionSuggestion = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  totalPages: number;
  usageCount: number;
  /** True when this reader already has this edition on their own shelf. */
  onShelf: boolean;
};

/**
 * Typo-tolerant suggestions from the shared catalogue.
 *
 * Two matchers, deliberately OR'd:
 *   - `ILIKE %term%` catches substrings ("broker" inside "the power broker"),
 *   - `%` (trigram similarity) catches typos ("powr brokr").
 *
 * Both are served by the same GIN trigram index — gin_trgm_ops accelerates
 * leading-wildcard LIKE, which a btree index cannot do.
 *
 * Ranking uses word_similarity rather than plain similarity: plain similarity
 * is length-normalised, so a short query against a long title always scores
 * badly, which is exactly the autocomplete case.
 */
export async function searchEditions(
  userId: string,
  term: string,
  limit = 8,
): Promise<EditionSuggestion[]> {
  const query = normalizeTitle(term);
  if (!query) return [];

  const onShelf = sql<boolean>`exists (
    select 1 from ${book}
    where ${book.editionId} = ${bookEdition.id} and ${book.userId} = ${userId}
  )`;

  const columns = {
    id: bookEdition.id,
    title: bookEdition.title,
    author: bookEdition.author,
    coverUrl: bookEdition.coverUrl,
    totalPages: bookEdition.totalPages,
    usageCount: bookEdition.usageCount,
    onShelf,
  };

  // Trigrams need three characters; below that, prefix-match instead of
  // returning nothing.
  if (query.length < TRIGRAM_MIN_LENGTH) {
    return db
      .select(columns)
      .from(bookEdition)
      .where(ilike(bookEdition.normalizedTitle, `${query}%`))
      .orderBy(desc(bookEdition.usageCount), bookEdition.title)
      .limit(limit);
  }

  return db
    .select(columns)
    .from(bookEdition)
    .where(
      or(
        ilike(bookEdition.normalizedTitle, `%${query}%`),
        sql`${bookEdition.normalizedTitle} % ${query}`,
      ),
    )
    .orderBy(
      sql`word_similarity(${query}, ${bookEdition.normalizedTitle}) desc`,
      desc(bookEdition.usageCount),
    )
    .limit(limit);
}

export async function getEdition(editionId: string) {
  const [row] = await db
    .select()
    .from(bookEdition)
    .where(eq(bookEdition.id, editionId))
    .limit(1);
  return row ?? null;
}

/** Is this exact edition already on the reader's shelf? */
export async function editionOnShelf(userId: string, editionId: string) {
  const [row] = await db
    .select({ id: book.id })
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.editionId, editionId)))
    .limit(1);
  return row?.id ?? null;
}

export async function countEditions() {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(bookEdition);
  return row?.n ?? 0;
}
