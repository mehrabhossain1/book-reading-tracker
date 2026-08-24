import { z } from "zod";

export const logProgressSchema = z
  .object({
    bookId: z.uuid(),
    startPage: z.coerce
      .number({ error: "Enter a page number." })
      .int("Use a whole number.")
      .min(1, "Pages start at 1."),
    endPage: z.coerce
      .number({ error: "Enter the page you stopped on." })
      .int("Use a whole number.")
      .min(1, "Pages start at 1."),
    note: z
      .string()
      .trim()
      .max(1000, "Keep the note under 1000 characters.")
      .optional()
      .transform((value) => (value ? value : null)),
    finished: z.boolean().default(false),
  })
  .refine((data) => data.endPage >= data.startPage, {
    path: ["endPage"],
    message: "The end page can't be before the start page.",
  });

export type LogProgressInput = z.input<typeof logProgressSchema>;

/**
 * Client-side twin of the schema above. The server keeps `z.coerce` so it stays
 * safe against any payload; the form deals in real numbers (`valueAsNumber`) so
 * react-hook-form's types stay honest.
 */
export const logProgressFormSchema = z
  .object({
    bookId: z.uuid(),
    startPage: z
      .number({ error: "Enter a page number." })
      .int("Use a whole number.")
      .min(1, "Pages start at 1."),
    endPage: z
      .number({ error: "Enter the page you stopped on." })
      .int("Use a whole number.")
      .min(1, "Pages start at 1."),
    note: z.string().trim().max(1000, "Keep the note under 1000 characters."),
    finished: z.boolean(),
  })
  .refine((data) => data.endPage >= data.startPage, {
    path: ["endPage"],
    message: "The end page can't be before the start page.",
  });

export type LogProgressFormValues = z.infer<typeof logProgressFormSchema>;
