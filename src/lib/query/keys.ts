/**
 * Every query key in one place. Invalidation is by prefix, so the shape of
 * these arrays *is* the cache-invalidation design.
 */
export const queryKeys = {
  /** The reader's whole shelf — tabs, counts and "continue reading" derive from it. */
  library: ["library"] as const,
  book: (bookId: string) => ["book", bookId] as const,
  stats: ["stats"] as const,
  catalogue: (term: string) => ["catalogue", term] as const,
};
