import { queryOptions } from "@tanstack/react-query";

import { ApiError, fetchJson } from "@/lib/api-client";
import { queryKeys } from "@/lib/query/keys";
import type { BookDetailDTO, LibraryDTO, StatsDTO } from "@/modules/books/dto";

/**
 * Client-side query definitions. On the server, pages prefetch the same keys
 * through the loaders directly, so these fetchers only run in the browser.
 */

export const libraryQuery = () =>
  queryOptions({
    queryKey: queryKeys.library,
    queryFn: ({ signal }) => fetchJson<LibraryDTO>("/api/library", signal),
  });

export const bookQuery = (bookId: string) =>
  queryOptions({
    queryKey: queryKeys.book(bookId),
    // A deleted book is a state to render, not an error to throw — the server
    // loader returns null for it, and the client must agree on that shape.
    queryFn: async ({ signal }): Promise<BookDetailDTO | null> => {
      try {
        return await fetchJson<BookDetailDTO>(`/api/books/${bookId}`, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });

export const statsQuery = () =>
  queryOptions({
    queryKey: queryKeys.stats,
    queryFn: ({ signal }) => fetchJson<StatsDTO>("/api/stats", signal),
  });
