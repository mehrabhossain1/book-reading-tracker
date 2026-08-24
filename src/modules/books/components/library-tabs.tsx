import Link from "next/link";

import type { BookStatus } from "@/db/schema";
import { cn } from "@/lib/utils";
import { BOOK_STATUS_META, STATUS_ORDER } from "@/modules/books/status";

export function LibraryTabs({
  active,
  counts,
}: {
  active: BookStatus;
  counts: Partial<Record<BookStatus, number>>;
}) {
  return (
    // Scrolls rather than wraps on narrow screens, so no tab is ever cut off.
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <nav className="bg-muted inline-flex w-max items-center gap-0.5 rounded-lg p-0.5">
        {STATUS_ORDER.map((status) => {
          const count = counts[status] ?? 0;
          return (
            <Link
              key={status}
              href={status === "reading" ? "/library" : `/library?status=${status}`}
              aria-current={active === status ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1 text-sm whitespace-nowrap transition-colors",
                active === status
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {BOOK_STATUS_META[status].label}
              {count > 0 && (
                <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
