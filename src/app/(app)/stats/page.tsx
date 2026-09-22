import type { Metadata } from "next";

import { queryKeys } from "@/lib/query/keys";
import { Prefetch } from "@/lib/query/prefetch";
import { requireUser } from "@/lib/session";
import { loadStats } from "@/modules/books/loaders";
import { StatsView } from "@/modules/stats/components/stats-view";

export const metadata: Metadata = { title: "Stats" };

export default async function StatsPage() {
  const user = await requireUser();
  return (
    <Prefetch queryKey={queryKeys.stats} queryFn={() => loadStats(user.id)}>
      <StatsView />
    </Prefetch>
  );
}
