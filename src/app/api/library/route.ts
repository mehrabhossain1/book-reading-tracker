import { ok, unauthorized } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/session";
import { loadLibrary } from "@/modules/books/loaders";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok(await loadLibrary(user.id));
}
