"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";

import { LinkPendingBar } from "@/components/link-pending-bar";
import { RelativeTime } from "@/components/relative-time";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookActionsMenu } from "@/modules/books/components/book-actions-menu";
import { BookCover } from "@/modules/books/components/book-cover";
import type { BookDTO } from "@/modules/books/dto";
import { isStale, pagesRemaining, progressPercent } from "@/modules/books/progress";
import { LogProgressDialog } from "@/modules/progress/components/log-progress-dialog";

export function BookRow({ book }: { book: BookDTO }) {
  const [intent, setIntent] = useState(false);
  const percent = progressPercent(book.currentPage, book.totalPages);
  const remaining = pagesRemaining(book.currentPage, book.totalPages);
  const stale =
    book.status === "reading" && isStale(book.lastReadAt ? new Date(book.lastReadAt) : null, new Date());
  const finished = book.status === "finished";
  const href = `/books/${book.id}`;

  // Intent-based FULL prefetch (route and data, via the page's own server
  // prefetch). Pointer over the card, keyboard focus, or a finger landing on it
  // all signal an imminent open; only then is this row prefetched, rather than
  // every row in the viewport on every visit. Measured at 4G latency: opening a
  // book 250ms after hovering it takes ~47ms instead of ~190ms. A click with no
  // lead time still gets LinkPendingBar as acknowledgement.
  //
  // Done by flipping <Link prefetch> to `true` — a full prefetch of a dynamic
  // route — not router.prefetch(): with no loading.js, router.prefetch follows
  // the automatic rules and fetches nothing for a dynamic route (a 700ms hover
  // made no difference until this changed).
  const prefetch = () => setIntent(true);

  return (
    <li
      onPointerEnter={prefetch}
      onTouchStart={prefetch}
      className={cn(
        "bg-card border-border group relative flex gap-3.5 rounded-xl border p-3.5 transition-colors sm:gap-4 sm:p-4",
        "hover:border-primary/35",
      )}
    >
      <Link href={href} prefetch={false} className="shrink-0" tabIndex={-1} aria-hidden>
        <BookCover title={book.title} coverUrl={book.coverUrl} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={href}
              prefetch={intent}
              onFocus={prefetch}
              className="after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-0"
            >
              <span className="line-clamp-2 text-sm leading-snug font-medium sm:text-[0.9375rem]">
                {book.title}
              </span>
              <LinkPendingBar />
            </Link>
            {book.author && (
              <p className="text-muted-foreground mt-0.5 truncate text-[0.8125rem]">{book.author}</p>
            )}
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-1">
            {finished ? (
              <span className="text-success inline-flex items-center gap-1 text-xs font-medium">
                <CheckCircle2 className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Finished</span>
              </span>
            ) : (
              <span className="text-muted-foreground tabular text-xs font-medium">{percent}%</span>
            )}
            <BookActionsMenu book={book} />
          </div>
        </div>

        <Progress value={percent} className="mt-3 h-1.5" />

        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
          <span className="text-foreground tabular font-medium">
            {finished ? `All ${book.totalPages} pages` : `p. ${book.currentPage} of ${book.totalPages}`}
          </span>
          {!finished && (
            <>
              <span aria-hidden>·</span>
              <span className="tabular">{plural(remaining, "page")} left</span>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              stale ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            {stale && <Clock className="size-3.5" aria-hidden />}
            <RelativeTime iso={book.lastReadAt} prefix="Read " fallback="Not started yet" />
          </span>

          {!finished && (
            <div className="relative z-10">
              <LogProgressDialog
                book={book}
                trigger={
                  <Button variant="outline" size="sm" className="min-h-9">
                    Log progress
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
