import Link from "next/link";
import type { Metadata } from "next";
import { BookPlus, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { BookStatus } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { BookRow } from "@/modules/books/components/book-row";
import { LibraryTabs } from "@/modules/books/components/library-tabs";
import { countBooksByStatus, getMostRecentlyRead, listBooks } from "@/modules/books/queries";
import { BOOK_STATUS_META, isBookStatus } from "@/modules/books/status";
import { ContinueReadingBar } from "@/modules/progress/components/continue-reading-bar";

export const metadata: Metadata = { title: "Library" };

function parseStatus(value: string | string[] | undefined): BookStatus {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isBookStatus(candidate) ? candidate : "reading";
}

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const user = await requireUser();
  const status = parseStatus((await searchParams).status);

  const [books, counts, continueReading] = await Promise.all([
    listBooks(user.id, status),
    countBooksByStatus(user.id),
    status === "reading" ? getMostRecentlyRead(user.id) : Promise.resolve(null),
  ]);

  const now = new Date();
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
        <LibraryTabs active={status} counts={counts} />
      </div>

      {books.length === 0 ? (
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
        // Single column until there is genuinely room for two — below that a
        // grid just makes each card too narrow for the progress line.
        <ul className="mt-5 grid gap-3 xl:grid-cols-2">
          {books.map((book) => (
            <BookRow key={book.id} book={book} now={now} />
          ))}
        </ul>
      )}

      {continueReading && books.length > 0 && <ContinueReadingBar book={continueReading} />}
    </div>
  );
}
