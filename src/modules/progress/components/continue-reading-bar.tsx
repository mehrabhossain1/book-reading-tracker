import { Button } from "@/components/ui/button";
import type { Book } from "@/db/schema";
import { nextStartPage } from "@/modules/books/progress";
import { BookCover } from "@/modules/books/components/book-cover";
import { LogProgressDialog } from "@/modules/progress/components/log-progress-dialog";

/**
 * Pinned bottom bar, after Blinkist's "Continue reading" strip: the single most
 * likely next action is always one tap away, whatever you scrolled to.
 */
export function ContinueReadingBar({ book }: { book: Book }) {
  return (
    <div className="pointer-events-none sticky bottom-16 z-30 mt-8 md:bottom-6">
      <div className="bg-background/95 border-border pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-xl border px-3 py-2.5 shadow-lg backdrop-blur">
        <BookCover title={book.title} coverUrl={book.coverUrl} className="h-10 w-7" />
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[0.6875rem] tracking-wide uppercase">
            Continue reading
          </p>
          <p className="truncate text-sm font-medium">{book.title}</p>
        </div>
        <LogProgressDialog
          book={{
            id: book.id,
            title: book.title,
            totalPages: book.totalPages,
            currentPage: book.currentPage,
          }}
          trigger={
            <Button size="sm" className="shrink-0">
              Page {nextStartPage(book.currentPage, book.totalPages)}
            </Button>
          }
        />
      </div>
    </div>
  );
}
