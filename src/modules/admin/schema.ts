import { z } from "zod";

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
