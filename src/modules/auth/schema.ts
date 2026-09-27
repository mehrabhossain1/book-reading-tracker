import { z } from "zod";

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

/** One rule for every place a *new* password is chosen. */
const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(MAX_PASSWORD_LENGTH, "That password is too long.");

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "What should we call you?").max(100),
  email: z.email("Enter a valid email address."),
  password: newPassword,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

/**
 * Changing your own password. The current one is required — a signed-in tab
 * left open on a shared machine must not be enough to take the account over,
 * which is also why `signOutOtherSessions` defaults to true.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword,
    confirmPassword: z.string().min(1, "Repeat the new password."),
    /** The form supplies this, ticked by default. */
    signOutOtherSessions: z.boolean(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "These two don't match.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "That is already your password.",
    path: ["newPassword"],
  });

/**
 * Adding a password to an account that has none — someone who signed up with
 * Google. There is no current password to ask for, so the live session is the
 * proof of identity.
 */
export const setPasswordSchema = z
  .object({
    newPassword,
    confirmPassword: z.string().min(1, "Repeat the new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "These two don't match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type SetPasswordValues = z.infer<typeof setPasswordSchema>;
