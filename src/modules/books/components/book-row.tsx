import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Book } from "@/db/schema";
import { formatRelative, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookActionsMenu } from "@/modules/books/components/book-actions-menu";
import { BookCover } from "@/modules/books/components/book-cover";
import { isStale, pagesRemaining, progressPercent } from "@/modules/books/progress";
import { LogProgressDialog } from "@/modules/progress/components/log-progress-dialog";

export function BookRow({ book, now = new Date() }: { book: Book; now?: Date }) {
  const percent = progressPercent(book.currentPage, book.totalPages);
  const remaining = pagesRemaining(book.currentPage, book.totalPages);
  const stale = book.status === "reading" && isStale(book.lastReadAt, now);
  const finished = book.status === "finished";

  return (
    <li
      className={cn(
        "bg-card border-border group relative flex gap-3.5 rounded-xl border p-3.5 transition-colors sm:gap-4 sm:p-4",
        "hover:border-primary/35",
      )}
    >
      <Link href={`/books/${book.id}`} className="shrink-0" tabIndex={-1} aria-hidden>
        <BookCover title={book.title} coverUrl={book.coverUrl} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/books/${book.id}`}
              // Stretched link: the whole card is the hit target on touch,
              // while the buttons below stay independently clickable.
              className="after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-0"
            >
              <span className="line-clamp-2 text-sm leading-snug font-medium sm:text-[0.9375rem]">
                {book.title}
              </span>
            </Link>
            {book.author && (
              <p className="text-muted-foreground mt-0.5 truncate text-[0.8125rem]">
                {book.author}
              </p>
            )}
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-1">
            {finished ? (
              <span className="text-success inline-flex items-center gap-1 text-xs font-medium">
                <CheckCircle2 className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Finished</span>
              </span>
            ) : (
              <span className="text-muted-foreground tabular text-xs font-medium">
                {percent}%
              </span>
            )}
            <BookActionsMenu bookId={book.id} status={book.status} />
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
            {book.lastReadAt ? `Read ${formatRelative(book.lastReadAt, now)}` : "Not started yet"}
          </span>

          {!finished && (
            <div className="relative z-10">
              <LogProgressDialog
                book={{
                  id: book.id,
                  title: book.title,
                  totalPages: book.totalPages,
                  currentPage: book.currentPage,
                }}
                trigger={
                  <Button variant="outline" size="sm">
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
