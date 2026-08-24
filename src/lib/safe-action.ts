import "server-only";

import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import type { AuthUser } from "@/lib/auth";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Throw this for an expected, user-facing failure ("You already added that book"). */
export class ActionError extends Error {}

/** Next signals redirect()/notFound() by throwing — those must pass straight through. */
function isNextControlFlow(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_")
  );
}

/**
 * Wraps a server action so that every one of them, without exception:
 *   1. resolves the session server-side (never trusts a client-sent userId),
 *   2. validates input against the same Zod schema the form uses,
 *   3. hands the handler a guaranteed `user`,
 *   4. returns a typed result instead of throwing at the UI.
 *
 * Rate limiting, plan gating and audit logging all belong here later — one
 * edit, rather than one per action.
 */
export function authedAction<TSchema extends z.ZodType, TOut>(
  schema: TSchema,
  handler: (input: z.output<TSchema>, ctx: { user: AuthUser }) => Promise<TOut>,
) {
  return async (input: z.input<TSchema>): Promise<ActionResult<TOut>> => {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "You need to be signed in to do that." };

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      };
    }

    try {
      return { ok: true, data: await handler(parsed.data, { user }) };
    } catch (error) {
      if (isNextControlFlow(error)) throw error;
      if (error instanceof ActionError) return { ok: false, error: error.message };
      console.error("[action]", error);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };
}
