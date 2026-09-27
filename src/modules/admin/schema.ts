import { z } from "zod";

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { APP_ROLES } from "@/modules/admin/permissions";

export const setUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(APP_ROLES),
});

export const banUserSchema = z.object({
  userId: z.string().min(1),
  banReason: z
    .string()
    .trim()
    .max(500, "Keep the reason under 500 characters.")
    .optional()
    .transform((value) => (value ? value : undefined)),
  /** Days; omit for an indefinite ban. */
  banForDays: z.coerce.number().int().min(1).max(3650).optional(),
});

export const userIdSchema = z.object({ userId: z.string().min(1) });

/**
 * Setting someone else's password. No confirmation field: the admin can reveal
 * what they typed, and they have to pass it on to the account holder anyway.
 */
export const setUserPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(MAX_PASSWORD_LENGTH, "That password is too long."),
  /** Ends their other sessions, so a stolen session can't outlive the reset. */
  signOutEverywhere: z.boolean(),
});
