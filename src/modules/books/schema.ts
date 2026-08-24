import { z } from "zod";

import { BOOK_STATUSES } from "@/db/schema";

/** Empty form fields arrive as "" — normalise them to null at the boundary. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .optional()
    .transform((value) => (value ? value : null));

export const bookStatusSchema = z.enum(BOOK_STATUSES);

export const createBookSchema = z.object({
  /** Set when the reader picked an existing catalogue entry from suggestions. */
  editionId: z.uuid().optional(),
  title: z.string().trim().min(1, "A title is required.").max(300),
  author: optionalText(200),
  totalPages: z.coerce
    .number({ error: "Enter the page count." })
    .int("Use a whole number.")
    .min(1, "A book has at least one page.")
    .max(50_000, "That seems too long — check the number."),
  coverUrl: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .refine((value) => !value || /^https?:\/\//i.test(value), "Must start with http:// or https://")
    .transform((value) => (value ? value : null)),
  status: bookStatusSchema.default("reading"),
});

export const updateBookSchema = createBookSchema.extend({
  bookId: z.uuid(),
});

export const setBookStatusSchema = z.object({
  bookId: z.uuid(),
  status: bookStatusSchema,
});

export const deleteBookSchema = z.object({
  bookId: z.uuid(),
});

export type CreateBookInput = z.input<typeof createBookSchema>;
export type UpdateBookInput = z.input<typeof updateBookSchema>;
