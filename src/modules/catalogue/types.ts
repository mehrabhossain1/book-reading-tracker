/** One catalogue entry as search returns it — identical for every reader. */
export type CatalogueMatch = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  totalPages: number;
  usageCount: number;
};

/** A match plus the per-reader bit, computed on the client from their shelf. */
export type EditionSuggestion = CatalogueMatch & { onShelf: boolean };
