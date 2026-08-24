import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Book } from "@/db/schema";
import { BookCover } from "@/modules/books/components/book-cover";
import { nextStartPage, progressPercent } from "@/modules/books/progress";
import { LogProgressDialog } from "@/modules/progress/components/log-progress-dialog";

/**
 * Pinned bar, after Blinkist's "Continue reading" strip: the single most likely
 * next action stays one tap away, whatever you scrolled to. Sits above the
 * mobile tab bar and clears the home indicator.
 */
export function ContinueReadingBar({ book }: { book: Book }) {
  const resume = nextStartPage(book.currentPage, book.totalPages);

  return (
    <div className="pointer-events-none sticky bottom-[4.5rem] z-30 mt-8 md:bottom-6">
      <div className="bg-card/95 border-border pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-2xl border p-2.5 shadow-lg backdrop-blur-md">
        <BookCover title={book.title} coverUrl={book.coverUrl} className="h-11 w-8" />
        <div className="min-w-0 flex-1">
          <p className="text-primary text-[0.6875rem] font-medium tracking-wide uppercase">
            Continue reading
          </p>
          <p className="truncate text-sm font-medium">{book.title}</p>
          <p className="text-muted-foreground tabular text-xs">
            {progressPercent(book.currentPage, book.totalPages)}% · resume on page {resume}
          </p>
        </div>
        <LogProgressDialog
          book={{
            id: book.id,
            title: book.title,
            totalPages: book.totalPages,
            currentPage: book.currentPage,
          }}
          trigger={
            <Button size="lg" className="shrink-0 gap-1.5">
              <span className="tabular">p.{resume}</span>
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          }
        />
      </div>
    </div>
  );
}
