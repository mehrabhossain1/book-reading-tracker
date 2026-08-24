import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, plural } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { BookActionsMenu } from "@/modules/books/components/book-actions-menu";
import { BookCover } from "@/modules/books/components/book-cover";
import { pagesRemaining, progressPercent } from "@/modules/books/progress";
import { getBook, getBookSessions } from "@/modules/books/queries";
import { LogProgressDialog } from "@/modules/progress/components/log-progress-dialog";
import { SessionTimeline } from "@/modules/progress/components/session-timeline";

export async function generateMetadata({
  params,
}: PageProps<"/books/[bookId]">): Promise<Metadata> {
  const user = await requireUser();
  const book = await getBook(user.id, (await params).bookId);
  return { title: book?.title ?? "Book" };
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

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-2.5">
        <Link href="/library">
          <ChevronLeft className="size-4" />
          Library
        </Link>
      </Button>

      <div className="mt-4 flex items-start gap-4">
        <BookCover title={book.title} coverUrl={book.coverUrl} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl leading-tight font-semibold tracking-tight text-balance">
                {book.title}
              </h1>
              {book.author && <p className="text-muted-foreground mt-1">{book.author}</p>}
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

          <Progress value={percent} className="mt-5 h-1.5" />
          <p className="mt-2 text-sm">
            <span className="font-medium">{percent}%</span>
            <span className="text-muted-foreground">
              {" · "}page {book.currentPage} of {book.totalPages}
              {book.status !== "finished" && ` · ${plural(remaining, "page")} left`}
            </span>
          </p>

          {book.status !== "finished" && (
            <div className="mt-4">
              <LogProgressDialog
                book={{
                  id: book.id,
                  title: book.title,
                  totalPages: book.totalPages,
                  currentPage: book.currentPage,
                }}
                trigger={<Button size="lg">Update your progress</Button>}
              />
            </div>
          )}
        </div>
      </div>

      <dl className="border-border text-muted-foreground mt-8 grid grid-cols-2 gap-y-3 border-t pt-6 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs tracking-wide uppercase">Started</dt>
          <dd className="text-foreground mt-0.5">{formatDate(book.startedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide uppercase">Finished</dt>
          <dd className="text-foreground mt-0.5">{formatDate(book.finishedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide uppercase">Sessions</dt>
          <dd className="text-foreground mt-0.5">{sessions.length}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide uppercase">Pages logged</dt>
          <dd className="text-foreground mt-0.5">{totalLogged}</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium">Reading history</h2>
        <SessionTimeline sessions={sessions} />
      </section>
    </div>
  );
}
