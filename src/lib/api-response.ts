/**
 * Every data route returns per-reader data, so no shared cache (a CDN, a
 * corporate proxy) may ever store it. The browser-side cache is TanStack
 * Query's job, not HTTP's.
 */
const PRIVATE = { "Cache-Control": "private, no-store" } as const;

export const ok = (data: unknown) => Response.json(data, { headers: PRIVATE });
export const unauthorized = () =>
  Response.json({ error: "Not signed in." }, { status: 401, headers: PRIVATE });
export const notFound = () =>
  Response.json({ error: "Not found." }, { status: 404, headers: PRIVATE });
