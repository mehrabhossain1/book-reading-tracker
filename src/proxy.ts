import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Next 16 renamed middleware.ts -> proxy.ts.
 *
 * Everything here is an OPTIMISTIC check on cookie *presence*; it never
 * validates a session. Real enforcement is requireUser() and authedAction.
 *
 * The rule that keeps it safe: only redirect towards a page that validates the
 * session itself. The earlier version also bounced cookie-holders away from
 * /sign-in — but a cookie can outlive its session (ban, "revoke sessions", a
 * server-side sign-out), and /library then sent them straight back to
 * /sign-in: an infinite redirect loop, "Too many redirects" in Safari, fixable
 * only by clearing cookies. Signed-in visitors to /sign-in are now redirected
 * by the (auth) layout, which checks the session properly.
 */
const APP_ROUTES = ["/library", "/books", "/stats", "/settings", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(getSessionCookie(request));

  // The landing page is static and served from the CDN; a returning reader
  // skips it. Safe: /library validates, and a stale cookie lands on /sign-in,
  // which no longer redirects back.
  if (pathname === "/" && hasSessionCookie) {
    return NextResponse.redirect(new URL("/library", request.url));
  }

  if (!hasSessionCookie && APP_ROUTES.some((route) => pathname.startsWith(route))) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/library/:path*",
    "/books/:path*",
    "/stats/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
