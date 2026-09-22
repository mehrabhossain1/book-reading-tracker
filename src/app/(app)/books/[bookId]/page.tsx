import type { Metadata } from "next";

import { queryKeys } from "@/lib/query/keys";
import { Prefetch } from "@/lib/query/prefetch";
import { requireUser } from "@/lib/session";
import { BookDetailView } from "@/modules/books/components/book-detail-view";
import { loadBookDetail } from "@/modules/books/loaders";
import { getBook } from "@/modules/books/queries";

export async function generateMetadata({ params }: PageProps<"/books/[bookId]">): Promise<Metadata> {
  const user = await requireUser();
  // getBook is cache()'d, so this shares its query with the prefetch below.
  const book = await getBook(user.id, (await params).bookId);
  return { title: book?.title ?? "Book" };
}

export default async function BookDetailPage({ params }: PageProps<"/books/[bookId]">) {
  const user = await requireUser();
  const { bookId } = await params;

  return (
    <Prefetch queryKey={queryKeys.book(bookId)} queryFn={() => loadBookDetail(user.id, bookId)}>
      <BookDetailView bookId={bookId} />
    </Prefetch>
  );
}
