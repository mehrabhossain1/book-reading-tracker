import "server-only";

import { HydrationBoundary, dehydrate, type QueryKey } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query/client";

/**
 * Prefetches on the server and hands the result to the client cache.
 *
 * Awaited on purpose. Streaming a still-pending query only pays off when there
 * is a Suspense boundary to stream into — and route-level loading skeletons
 * were measured to *delay* content: React holds content back until a shown
 * fallback has been visible for ~300ms, so a 185ms page arrived at ~320ms.
 * Without a fallback, navigation is a transition: the current page stays up
 * until the next one is complete, and the clicked link shows its own pending
 * hint (see LinkPendingBar).
 */
export async function Prefetch({
  queryKey,
  queryFn,
  children,
}: {
  queryKey: QueryKey;
  queryFn: () => Promise<unknown>;
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey, queryFn });
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
