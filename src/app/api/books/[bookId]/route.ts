import { z } from "zod";

import { notFound, ok, unauthorized } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/session";
import { loadBookDetail } from "@/modules/books/loaders";

export async function GET(_request: Request, context: RouteContext<"/api/books/[bookId]">) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { bookId } = await context.params;
  // A malformed id would make Postgres throw on the uuid cast and surface as a
  // 500. It's simply a book that doesn't exist.
  if (!z.uuid().safeParse(bookId).success) return notFound();

  const detail = await loadBookDetail(user.id, bookId);
  return detail ? ok(detail) : notFound();
}
