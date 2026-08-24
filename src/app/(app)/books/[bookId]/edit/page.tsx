import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { requireUser } from "@/lib/session";
import { BookForm } from "@/modules/books/components/book-form";
import { getBook } from "@/modules/books/queries";

export const metadata: Metadata = { title: "Edit book" };

export default async function EditBookPage({ params }: PageProps<"/books/[bookId]/edit">) {
  const user = await requireUser();
  const book = await getBook(user.id, (await params).bookId);
  if (!book) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight">Edit book</h1>
      <div className="mt-8">
        <BookForm
          book={{
            id: book.id,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            totalPages: book.totalPages,
            status: book.status,
          }}
        />
      </div>
    </div>
  );
}
