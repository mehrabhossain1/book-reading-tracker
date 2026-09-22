"use client";

import type { BookStatus } from "@/db/schema";
import { cn } from "@/lib/utils";
import { BOOK_STATUS_META, STATUS_ORDER } from "@/modules/books/status";

export const hrefForStatus = (status: BookStatus) =>
  status === "reading" ? "/library" : `/library?status=${status}`;

/**
 * Tabs switch on the client, from data already in memory — the whole shelf is
 * one query. The URL still updates (via history.pushState, which Next keeps in
 * sync with useSearchParams), so tabs remain linkable, survive a refresh, and
 * work with the back button.
 *
 * They are real <a href> links: middle-click and ⌘-click open a new tab as
 * expected, and only a plain click is intercepted.
 */
export function LibraryTabs({
  active,
  counts,
  onSelect,
}: {
  active: BookStatus;
  counts: Partial<Record<BookStatus, number>>;
  onSelect: (status: BookStatus) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] max-lg:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] [&::-webkit-scrollbar]:hidden">
      <nav
        aria-label="Filter library by status"
        className="bg-muted inline-flex w-max items-center gap-1 rounded-xl p-1"
      >
        {STATUS_ORDER.map((status) => {
          const count = counts[status] ?? 0;
          const isActive = active === status;
          return (
            <a
              key={status}
              href={hrefForStatus(status)}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                onSelect(status);
              }}
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
            </a>
          );
        })}
      </nav>
    </div>
  );
}
