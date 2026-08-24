import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Next 16 renamed middleware.ts -> proxy.ts.
 *
 * This is an OPTIMISTIC cookie check for UX only — it keeps a signed-out
 * visitor from flashing the app shell. It does NOT validate the session.
 * Real enforcement is `requireUser()` in layouts/pages and `authedAction`
 * in every mutation.
 */
const APP_ROUTES = ["/library", "/books", "/stats", "/settings"];
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(getSessionCookie(request));

  if (!hasSessionCookie && APP_ROUTES.some((route) => pathname.startsWith(route))) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  if (hasSessionCookie && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/library", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/books/:path*", "/stats/:path*", "/settings/:path*", "/sign-in", "/sign-up"],
};
