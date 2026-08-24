import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, type AuthUser } from "@/lib/auth";
import { isStaff, isSuperAdmin } from "@/modules/admin/permissions";

/**
 * `cache` dedupes this across a single render pass, so a layout and the page
 * inside it don't each hit the session store.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getCurrentUser(): Promise<AuthUser | null> {
  return (await getSession())?.user ?? null;
}

/**
 * The real guard. `proxy.ts` only does an optimistic cookie check for UX —
 * anything that reads or writes data calls this instead.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * Staff gate for the back office. Sends non-staff to the library rather than
 * to sign-in — they *are* signed in, they simply aren't staff, and bouncing
 * them to a login form would be a lie.
 */
export async function requireStaff(): Promise<AuthUser> {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/library");
  return user;
}

/** Super-admin-only actions: promoting/demoting staff, impersonating admins. */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (!isSuperAdmin(user.role)) redirect("/library");
  return user;
}
