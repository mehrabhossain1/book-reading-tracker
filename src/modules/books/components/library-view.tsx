"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookPlus, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { BookRow } from "@/modules/books/components/book-row";
import { LibraryTabs, hrefForStatus } from "@/modules/books/components/library-tabs";
import type { LibraryDTO } from "@/modules/books/dto";
import { booksWithStatus, continueReading, countByStatus } from "@/modules/books/library";
import { pendingDeletes } from "@/modules/books/pending-deletes";
import { libraryQuery } from "@/modules/books/query-options";
import { BOOK_STATUS_META, isBookStatus } from "@/modules/books/status";
import { ContinueReadingBar } from "@/modules/progress/components/continue-reading-bar";

/** Books inside an Undo window stay hidden even if a refetch brings them back. */
function hidePendingDeletes(data: LibraryDTO): LibraryDTO {
  if (pendingDeletes.size === 0) return data;
  return { books: data.books.filter((book) => !pendingDeletes.has(book.id)) };
}

export function LibraryView() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("status");
  const status = isBookStatus(raw) ? raw : "reading";

  const { data } = useSuspenseQuery({ ...libraryQuery(), select: hidePendingDeletes });

  const counts = countByStatus(data.books);
  const visible = booksWithStatus(data.books, status);
  const current = status === "reading" ? continueReading(data.books) : null;
  const empty = BOOK_STATUS_META[status];
  const activeCount = counts.reading ?? 0;

  return (
    <div>
      <PageHeader
        title="Library"
        description={
          activeCount > 0
            ? `${activeCount} ${activeCount === 1 ? "book" : "books"} on the go.`
            : "Everything you're reading, in one place."
        }
        action={
          <Button asChild className="hidden gap-1.5 md:inline-flex xl:hidden">
            <Link href="/books/new">
              <Plus className="size-4" aria-hidden />
              Add a book
            </Link>
          </Button>
        }
      />

      <div className="mt-5">
        <LibraryTabs
          active={status}
          counts={counts}
          onSelect={(next) => window.history.pushState(null, "", hrefForStatus(next))}
        />
      </div>

      {visible.length === 0 ? (
        <div className="border-border bg-card/50 mt-6 rounded-2xl border border-dashed px-6 py-16 text-center">
          <span className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-xl">
            <BookPlus className="size-5" aria-hidden />
          </span>
          <p className="mt-4 font-medium">{empty.emptyTitle}</p>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed text-pretty">
            {empty.emptyBody}
          </p>
          <Button asChild size="lg" className="mt-6 gap-1.5">
            <Link href="/books/new">
              <Plus className="size-4" aria-hidden />
              Add a book
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 xl:grid-cols-2">
          {visible.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
        </ul>
      )}

      {current && visible.length > 0 && <ContinueReadingBar book={current} />}
    </div>
  );
}
