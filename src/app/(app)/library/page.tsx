import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BOOK_STATUSES, type BookStatus } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { BookRow } from "@/modules/books/components/book-row";
import { LibraryTabs } from "@/modules/books/components/library-tabs";
import { countBooksByStatus, getMostRecentlyRead, listBooks } from "@/modules/books/queries";
import { ContinueReadingBar } from "@/modules/progress/components/continue-reading-bar";

export const metadata: Metadata = { title: "Library" };

const EMPTY_COPY: Record<string, { title: string; body: string }> = {
  reading: {
    title: "Nothing on the go",
    body: "Add a book and log the page you're on. Next time you pick it up, the page to resume from will already be filled in.",
  },
  paused: {
    title: "No paused books",
    body: "Books you set aside show up here, with your place kept exactly where you left it.",
  },
  finished: {
    title: "No finished books yet",
    body: "Books you complete land here.",
  },
};

function parseStatus(value: string | string[] | undefined): BookStatus {
  const candidate = Array.isArray(value) ? value[0] : value;
  return BOOK_STATUSES.includes(candidate as BookStatus)
    ? (candidate as BookStatus)
    : "reading";
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
  const empty = EMPTY_COPY[status];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Library</h1>
        <Button asChild size="sm" className="md:hidden">
          <Link href="/books/new">
            <Plus className="size-4" />
            Add
          </Link>
        </Button>
      </div>

      <div className="mt-4">
        <LibraryTabs active={status} counts={counts} />
      </div>

      {books.length === 0 ? (
        <div className="border-border mt-8 rounded-lg border border-dashed px-6 py-14 text-center">
          <p className="font-medium">{empty.title}</p>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
            {empty.body}
          </p>
          <Button asChild className="mt-6">
            <Link href="/books/new">
              <Plus className="size-4" />
              Add a book
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-2">
          {books.map((book) => (
            <BookRow key={book.id} book={book} now={now} />
          ))}
        </ul>
      )}

      {continueReading && books.length > 0 && <ContinueReadingBar book={continueReading} />}
    </div>
  );
}
