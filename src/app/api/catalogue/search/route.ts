import { getCurrentUser } from "@/lib/session";
import { searchEditions } from "@/modules/catalogue/queries";

/** Below two characters the result set is noise, not a suggestion. */
const MIN_QUERY_LENGTH = 2;

/**
 * Catalogue autocomplete.
 *
 * A route handler rather than a server action: search-as-you-type fires on
 * every keystroke, and a plain GET can be aborted by the browser when the query
 * moves on. Results are identical for every reader (the "on your shelf" flag is
 * worked out on the client), which is what lets searchEditions cache them.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ suggestions: [] }, { status: 401 });
  }

  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (term.length < MIN_QUERY_LENGTH) {
    return Response.json({ suggestions: [] });
  }

  const suggestions = await searchEditions(term);

  // Results are no longer per-reader, so the browser may reuse them briefly.
  // Still `private`: the catalogue sits behind sign-in.
  return Response.json(
    { suggestions },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
