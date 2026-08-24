"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOOK_STATUSES, type BookStatus } from "@/db/schema";
import { createBook, updateBook } from "@/modules/books/actions";
import { BOOK_STATUS_META, STATUS_ORDER } from "@/modules/books/status";

/** Form-side twin of createBookSchema — real numbers, no coercion. */
const bookFormSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(300),
  author: z.string().trim().max(200),
  totalPages: z
    .number({ error: "Enter the page count." })
    .int("Use a whole number.")
    .min(1, "A book has at least one page.")
    .max(50_000, "That seems too long — check the number."),
  coverUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => !v || /^https?:\/\//i.test(v), "Must start with http:// or https://"),
  status: z.enum(BOOK_STATUSES),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export function BookForm({
  book,
}: {
  book?: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    totalPages: number;
    status: BookStatus;
  };
}) {
  const router = useRouter();
  const isEdit = Boolean(book);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: book?.title ?? "",
      author: book?.author ?? "",
      totalPages: book?.totalPages ?? Number.NaN,
      coverUrl: book?.coverUrl ?? "",
      status: book?.status ?? "reading",
    },
  });

  const status = useWatch({ control: form.control, name: "status" });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = isEdit
      ? await updateBook({ ...values, bookId: book!.id })
      : await createBook(values);

    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof BookFormValues, { message: messages[0] });
        }
      }
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Book updated." : `${values.title} added.`);
    router.push(`/books/${result.data.bookId}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="bg-card border-border rounded-2xl border p-4 sm:p-6">
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.title)}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            autoFocus
            aria-invalid={Boolean(form.formState.errors.title)}
            {...form.register("title")}
          />
          <FieldError errors={[form.formState.errors.title]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.author)}>
          <FieldLabel htmlFor="author">Author</FieldLabel>
          <Input id="author" {...form.register("author")} />
          <FieldError errors={[form.formState.errors.author]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.totalPages)}>
          <FieldLabel htmlFor="totalPages">Total pages</FieldLabel>
          <Input
            id="totalPages"
            type="number"
            inputMode="numeric"
            className="tabular"
            min={1}
            aria-invalid={Boolean(form.formState.errors.totalPages)}
            {...form.register("totalPages", { valueAsNumber: true })}
          />
          <FieldDescription>
            Used for every progress figure — the page count of your copy, not the edition
            you found online.
          </FieldDescription>
          <FieldError errors={[form.formState.errors.totalPages]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.coverUrl)}>
          <FieldLabel htmlFor="coverUrl">Cover image URL</FieldLabel>
          <Input
            id="coverUrl"
            placeholder="https://…"
            aria-invalid={Boolean(form.formState.errors.coverUrl)}
            {...form.register("coverUrl")}
          />
          <FieldError errors={[form.formState.errors.coverUrl]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="status">Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(value) => form.setValue("status", value as BookStatus)}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {BOOK_STATUS_META[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Add book"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
