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

/**
 * The one URL rule, exported because book-form.tsx validates the same fields
 * client-side and two copies of a security check is one copy too many.
 *
 * Restricting to http(s) is not cosmetic: every one of these values ends up in
 * an `href`, and `javascript:`/`data:` there is script injection. We refuse
 * rather than sanitise — a rejected URL is a message the reader can act on.
 */
export const MAX_URL_LENGTH = 2048;
export const URL_ERROR = "Must start with http:// or https://";
export const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const optionalUrl = () =>
  z
    .string()
    .trim()
    .max(MAX_URL_LENGTH)
    .optional()
    .refine((value) => !value || isHttpUrl(value), URL_ERROR)
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
  coverUrl: optionalUrl(),
  /** The reader's own copy: a PDF, an EPUB, a Drive file, a web reader. */
  fileUrl: optionalUrl(),
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
