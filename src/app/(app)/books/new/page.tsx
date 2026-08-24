import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/session";
import { BookForm } from "@/modules/books/components/book-form";

export const metadata: Metadata = { title: "Add a book" };

export default async function NewBookPage() {
  await requireUser();

  return (
    <div className="max-w-xl">
      <PageHeader title="Add a book" description="Only the title and page count are required." />
      <div className="mt-8">
        <BookForm />
      </div>
    </div>
  );
}
