"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import { ActionError, authedAction } from "@/lib/safe-action";
import { changePasswordSchema, setPasswordSchema } from "@/modules/auth/schema";

/**
 * Password changes go through Better Auth's own endpoints rather than writing
 * the `account` table: it owns the hashing (scrypt, with its own parameters),
 * the length rules, and the session side effects. Hand-rolling any of that
 * here would be a second implementation to keep in step with the first.
 */

/** Better Auth reports expected failures as APIError with a stable code. */
function friendlyAuthError(error: unknown): ActionError {
  if (error instanceof APIError) {
    const code = (error.body as { code?: string } | undefined)?.code;
    if (code === "INVALID_PASSWORD") {
      return new ActionError("That current password isn't right.");
    }
    if (code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
      return new ActionError("This account signs in with Google and has no password yet.");
    }
    if (error.body?.message) return new ActionError(error.body.message);
  }
  return new ActionError("Could not update the password. Please try again.");
}

export const changeOwnPassword = authedAction(changePasswordSchema, async (input) => {
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        // Better Auth reissues the caller's own session cookie, so ticking this
        // signs out every *other* device without signing this one out.
        revokeOtherSessions: input.signOutOtherSessions,
      },
      headers: await headers(),
    });
  } catch (error) {
    throw friendlyAuthError(error);
  }

  return { signedOutOthers: input.signOutOtherSessions };
});

export const setOwnPassword = authedAction(setPasswordSchema, async (input) => {
  try {
    // A server-only endpoint: it has no current password to check, so the live
    // session is the only proof of identity and it must never be reachable
    // from the browser directly.
    await auth.api.setPassword({
      body: { newPassword: input.newPassword },
      headers: await headers(),
    });
  } catch (error) {
    throw friendlyAuthError(error);
  }

  return { ok: true };
});
