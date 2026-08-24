import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, ChevronLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, plural } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { BookActionsMenu } from "@/modules/books/components/book-actions-menu";
import { BookCover } from "@/modules/books/components/book-cover";
import { pagesRemaining, progressPercent } from "@/modules/books/progress";
import { getBook, getBookSessions } from "@/modules/books/queries";
import { statusLabel } from "@/modules/books/status";
import { LogProgressDialog } from "@/modules/progress/components/log-progress-dialog";
import { SessionTimeline } from "@/modules/progress/components/session-timeline";

export async function generateMetadata({
  params,
}: PageProps<"/books/[bookId]">): Promise<Metadata> {
  const user = await requireUser();
  const book = await getBook(user.id, (await params).bookId);
  return { title: book?.title ?? "Book" };
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[0.6875rem] tracking-wide uppercase">
        {label}
      </dt>
      <dd className="tabular mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function BookDetailPage({ params }: PageProps<"/books/[bookId]">) {
  const user = await requireUser();
  const { bookId } = await params;

  const book = await getBook(user.id, bookId);
  if (!book) notFound();

  const sessions = await getBookSessions(user.id, book.id);
  const percent = progressPercent(book.currentPage, book.totalPages);
  const remaining = pagesRemaining(book.currentPage, book.totalPages);
  const totalLogged = sessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const finished = book.status === "finished";

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
        <Link href="/library">
          <ChevronLeft className="size-4" aria-hidden />
          Library
        </Link>
      </Button>

      {/* Cover and identity share a row at every width; the progress card sits
          full-width beneath, so nothing has to fill an awkward gap beside a
          tall cover on a narrow screen. */}
      <div className="mt-4 flex items-start gap-4 sm:gap-5">
        <BookCover title={book.title} coverUrl={book.coverUrl} size="lg" />

        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
              {book.title}
            </h1>
            {book.author && (
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">{book.author}</p>
            )}
            <p className="text-muted-foreground mt-2 text-sm sm:hidden">
              {statusLabel(book.status)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button asChild variant="ghost" size="icon-sm" aria-label="Edit book">
              <Link href={`/books/${book.id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <BookActionsMenu bookId={book.id} status={book.status} />
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
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {statusLabel(book.status)}
            </span>
          )}
        </div>

        <Progress value={percent} className="mt-3 h-2" />

        <p className="text-muted-foreground tabular mt-2.5 text-sm">
          Page {book.currentPage} of {book.totalPages}
          {!finished && ` · ${plural(remaining, "page")} left`}
        </p>

        {!finished && (
          <LogProgressDialog
            book={{
              id: book.id,
              title: book.title,
              totalPages: book.totalPages,
              currentPage: book.currentPage,
            }}
            trigger={
              <Button size="lg" className="mt-4 w-full sm:w-auto">
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
