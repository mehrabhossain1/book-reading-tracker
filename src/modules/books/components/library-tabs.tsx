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
    // Bleeds to the screen edge and scrolls on mobile, so the fifth tab is
    // reachable rather than clipped.
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] max-lg:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] [&::-webkit-scrollbar]:hidden">
      <nav
        aria-label="Filter library by status"
        className="bg-muted inline-flex w-max items-center gap-1 rounded-xl p-1"
      >
        {STATUS_ORDER.map((status) => {
          const count = counts[status] ?? 0;
          const isActive = active === status;
          return (
            <Link
              key={status}
              href={status === "reading" ? "/library" : `/library?status=${status}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.8125rem] whitespace-nowrap transition-colors",
                isActive
                  ? "bg-card text-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {BOOK_STATUS_META[status].label}
              {count > 0 && (
                <span
                  className={cn(
                    "tabular rounded-md px-1.5 py-0.5 text-[0.6875rem] leading-none font-medium",
                    isActive ? "bg-primary/12 text-primary" : "bg-foreground/8 text-muted-foreground",
                  )}
                >
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
