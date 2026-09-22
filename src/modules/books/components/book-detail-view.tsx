"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookX, CheckCircle2, ChevronLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, plural } from "@/lib/format";
import { BookActionsMenu } from "@/modules/books/components/book-actions-menu";
import { BookCover } from "@/modules/books/components/book-cover";
import { pagesRemaining, progressPercent } from "@/modules/books/progress";
import { bookQuery } from "@/modules/books/query-options";
import { statusLabel } from "@/modules/books/status";
import { LogProgressDialog } from "@/modules/progress/components/log-progress-dialog";
import { SessionTimeline } from "@/modules/progress/components/session-timeline";

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[0.6875rem] tracking-wide uppercase">{label}</dt>
      <dd className="tabular mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function BackToLibrary() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 min-h-9 gap-1">
      <Link href="/library">
        <ChevronLeft className="size-4" aria-hidden />
        Library
      </Link>
    </Button>
  );
}

export function BookDetailView({ bookId }: { bookId: string }) {
  const router = useRouter();
  const { data } = useSuspenseQuery(bookQuery(bookId));

  // Deleted elsewhere, or never existed — a state, not a crash.
  if (!data) {
    return (
      <div>
        <BackToLibrary />
        <div className="border-border mt-6 rounded-2xl border border-dashed px-6 py-16 text-center">
          <BookX className="text-muted-foreground mx-auto size-8" aria-hidden />
          <p className="mt-4 font-medium">This book isn&apos;t on your shelf</p>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
            It may have been deleted. Your other books are still in the library.
          </p>
        </div>
      </div>
    );
  }

  const { book, sessions } = data;
  const percent = progressPercent(book.currentPage, book.totalPages);
  const remaining = pagesRemaining(book.currentPage, book.totalPages);
  const totalLogged = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const finished = book.status === "finished";

  return (
    <div>
      <BackToLibrary />

      <div className="mt-4 flex items-start gap-4 sm:gap-5">
        <BookCover title={book.title} coverUrl={book.coverUrl} size="lg" />

        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
              {book.title}
            </h1>
            {book.author && <p className="text-muted-foreground mt-1 text-sm sm:text-base">{book.author}</p>}
            <p className="text-muted-foreground mt-2 text-sm sm:hidden">{statusLabel(book.status)}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button asChild variant="ghost" size="icon-sm" className="size-9" aria-label="Edit book">
              <Link href={`/books/${book.id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            {/* Leave first, so the page isn't showing a book that just vanished. */}
            <BookActionsMenu book={book} onBeforeDelete={() => router.push("/library")} />
          </div>
        </div>
      </div>

      <div className="bg-card border-border mt-5 rounded-2xl border p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="tabular text-3xl font-semibold tracking-tight">{percent}%</p>
          {finished ? (
            <span className="text-success inline-flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle2 className="size-4" aria-hidden />
              Finished
            </span>
          ) : (
            <span className="text-muted-foreground hidden text-sm sm:inline">{statusLabel(book.status)}</span>
          )}
        </div>

        <Progress value={percent} className="mt-3 h-2" />

        <p className="text-muted-foreground tabular mt-2.5 text-sm">
          Page {book.currentPage} of {book.totalPages}
          {!finished && ` · ${plural(remaining, "page")} left`}
        </p>

        {!finished && (
          <LogProgressDialog
            book={book}
            trigger={
              <Button size="lg" className="mt-4 min-h-11 w-full sm:w-auto">
                Update your progress
              </Button>
            }
          />
        )}
      </div>

      <dl className="border-border mt-8 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-4">
        <Fact label="Started" value={formatDate(book.startedAt)} />
        <Fact label="Finished" value={formatDate(book.finishedAt)} />
        <Fact label="Sessions" value={sessions.length} />
        <Fact label="Pages logged" value={totalLogged} />
      </dl>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium">Reading history</h2>
        <SessionTimeline sessions={sessions} />
      </section>
    </div>
  );
}
