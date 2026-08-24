import Link from "next/link";

import { cn } from "@/lib/utils";
import type { BookStatus } from "@/db/schema";

const TABS = [
  { status: "reading", label: "Reading" },
  { status: "paused", label: "Paused" },
  { status: "finished", label: "Finished" },
] as const satisfies readonly { status: BookStatus; label: string }[];

export function LibraryTabs({
  active,
  counts,
}: {
  active: BookStatus;
  counts: Partial<Record<BookStatus, number>>;
}) {
  return (
    <nav className="bg-muted inline-flex items-center gap-0.5 rounded-lg p-0.5">
      {TABS.map(({ status, label }) => {
        const count = counts[status] ?? 0;
        return (
          <Link
            key={status}
            href={status === "reading" ? "/library" : `/library?status=${status}`}
            aria-current={active === status ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1 text-sm transition-colors",
              active === status
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {count > 0 && <span className="text-muted-foreground ml-1.5 text-xs">{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
