import type { Metadata } from "next";

import { requireUser } from "@/lib/session";
import { BookForm } from "@/modules/books/components/book-form";

export const metadata: Metadata = { title: "Add a book" };

export default async function NewBookPage() {
  await requireUser();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight">Add a book</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Only the title and page count are required.
      </p>
      <div className="mt-8">
        <BookForm />
      </div>
    </div>
  );
}
