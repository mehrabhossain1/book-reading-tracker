import "server-only";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/db";
import { book, bookEdition } from "@/db/schema";
import { TRIGRAM_MIN_LENGTH, normalizeTitle } from "@/modules/catalogue/normalize";
import type { CatalogueMatch } from "@/modules/catalogue/types";

/**
 * Typo-tolerant catalogue search, cached on the server and shared by everyone.
 *
 * It used to take a userId, to work out "is this already on your shelf?" in
 * SQL. That one bit made every result per-user and therefore uncacheable. The
 * client already holds the reader's whole shelf (each book carries its
 * editionId), so it answers that question itself — and this, the expensive
 * trigram search, becomes identical for every reader and cacheable for all.
 *
 * Tagged "catalogue": books/actions.ts expires it when a write may have added
 * an edition, so a newly contributed book is findable on the next search.
 *
 * Matching: ILIKE for substrings OR `%` for typos, both served by the GIN
 * trigram index; ranked by word_similarity, since plain similarity is
 * length-normalised and scores short queries against long titles badly.
 */
export const searchCatalogue = unstable_cache(
  async (query: string, limit: number): Promise<CatalogueMatch[]> => {
    const columns = {
      id: bookEdition.id,
      title: bookEdition.title,
      author: bookEdition.author,
      coverUrl: bookEdition.coverUrl,
      totalPages: bookEdition.totalPages,
      usageCount: bookEdition.usageCount,
    };

    // Trigrams need three characters; below that, prefix-match.
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
  },
  ["catalogue-search"],
  { tags: ["catalogue"], revalidate: 600 },
);

/** Normalises the raw input so "The Power" and "the power " share one cache entry. */
export async function searchEditions(term: string, limit = 8): Promise<CatalogueMatch[]> {
  const query = normalizeTitle(term);
  if (!query) return [];
  return searchCatalogue(query, limit);
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
