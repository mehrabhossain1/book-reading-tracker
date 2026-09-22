import { QueryClient, defaultShouldDehydrateQuery, isServer } from "@tanstack/react-query";

import { ApiError } from "@/lib/api-client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Anything the server just rendered is fresh; without this the client
        // would refetch every query the instant it hydrates.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        // Coming back to the tab after a reading session should show fresh
        // numbers without a manual reload.
        refetchOnWindowFocus: true,
        // A 401/404 won't fix itself on retry; a network blip might.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
          failureCount < 2,
      },
      dehydrate: {
        shouldDehydrateQuery: defaultShouldDehydrateQuery,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

/**
 * Server: a fresh client per call, so one reader's data can never be served to
 * another. Browser: one client for the whole session, so the cache survives
 * navigation. (Deliberately not useState — per the TanStack SSR guide, React
 * discards state from a render that suspends without a boundary, which would
 * silently throw the cache away.)
 */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}
