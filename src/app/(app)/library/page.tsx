import type { Metadata } from "next";

import { queryKeys } from "@/lib/query/keys";
import { Prefetch } from "@/lib/query/prefetch";
import { requireUser } from "@/lib/session";
import { LibraryView } from "@/modules/books/components/library-view";
import { loadLibrary } from "@/modules/books/loaders";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  const user = await requireUser();
  return (
    <Prefetch queryKey={queryKeys.library} queryFn={() => loadLibrary(user.id)}>
      <LibraryView />
    </Prefetch>
  );
}
