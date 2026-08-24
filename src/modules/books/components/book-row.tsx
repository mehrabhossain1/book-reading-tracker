import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Book } from "@/db/schema";
import { formatRelative, plural } from "@/lib/format";
import { isStale, pagesRemaining, progressPercent } from "@/modules/books/progress";
import { BookActionsMenu } from "@/modules/books/components/book-actions-menu";
import { BookCover } from "@/modules/books/components/book-cover";
import { LogProgressDialog } from "@/modules/progress/components/log-progress-dialog";

export function BookRow({ book, now = new Date() }: { book: Book; now?: Date }) {
  const percent = progressPercent(book.currentPage, book.totalPages);
  const remaining = pagesRemaining(book.currentPage, book.totalPages);
  const stale = book.status === "reading" && isStale(book.lastReadAt, now);

  return (
    <li className="border-border/70 flex items-start gap-3 border-b py-4 last:border-b-0">
      <Link href={`/books/${book.id}`} className="shrink-0">
        <BookCover title={book.title} coverUrl={book.coverUrl} />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/books/${book.id}`}
              className="block truncate text-sm font-medium hover:underline"
            >
              {book.title}
            </Link>
            {book.author && (
              <p className="text-muted-foreground truncate text-sm">{book.author}</p>
            )}
          </div>
          <BookActionsMenu bookId={book.id} status={book.status} />
        </div>

        <Progress value={percent} className="mt-2.5 h-1" />

        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="text-foreground font-medium">
            {book.status === "finished"
              ? "Finished"
              : `p. ${book.currentPage} of ${book.totalPages}`}
          </span>
          {book.status !== "finished" && <span aria-hidden>·</span>}
          {book.status !== "finished" && <span>{plural(remaining, "page")} left</span>}
          <span aria-hidden>·</span>
          <span className={stale ? "text-foreground" : undefined}>
            {book.lastReadAt ? `read ${formatRelative(book.lastReadAt, now)}` : "not started"}
          </span>
        </div>

        {book.status !== "finished" && (
          <div className="mt-3">
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
    </li>
  );
}
