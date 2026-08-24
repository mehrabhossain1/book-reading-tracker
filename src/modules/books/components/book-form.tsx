"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { RiCloseLine, RiSparkling2Fill } from "react-icons/ri";
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
import { TitleCombobox } from "@/modules/catalogue/components/title-combobox";
import type { EditionSuggestion } from "@/modules/catalogue/queries";

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
  /** Present when the title came from the shared catalogue. */
  editionId: z.string().optional(),
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
      editionId: undefined,
    },
  });

  const status = useWatch({ control: form.control, name: "status" });
  const title = useWatch({ control: form.control, name: "title" });
  const [linked, setLinked] = useState<EditionSuggestion | null>(null);

  /** Reuse an existing catalogue entry instead of creating a near-duplicate. */
  const applySuggestion = (edition: EditionSuggestion) => {
    form.setValue("title", edition.title, { shouldValidate: true });
    form.setValue("author", edition.author ?? "");
    form.setValue("totalPages", edition.totalPages, { shouldValidate: true });
    form.setValue("coverUrl", edition.coverUrl ?? "");
    form.setValue("editionId", edition.id);
    setLinked(edition);
  };

  const unlink = () => {
    form.setValue("editionId", undefined);
    setLinked(null);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const result = isEdit
      ? await updateBook({ ...values, bookId: book!.id })
      : await createBook({ ...values, editionId: values.editionId || undefined });

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
          {isEdit ? (
            <Input
              id="title"
              autoFocus
              aria-invalid={Boolean(form.formState.errors.title)}
              {...form.register("title")}
            />
          ) : (
            <TitleCombobox
              value={title ?? ""}
              onChange={(next) => {
                form.setValue("title", next, { shouldValidate: true });
                // Typing over a linked title means they want a different book.
                if (linked && next !== linked.title) unlink();
              }}
              onSelect={applySuggestion}
              invalid={Boolean(form.formState.errors.title)}
            />
          )}
          {!isEdit && !linked && (
            <FieldDescription>
              Start typing — if someone has already added this book, pick it and the
              details fill themselves in.
            </FieldDescription>
          )}
          {linked && (
            <div className="border-primary/30 bg-primary/8 mt-1 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs">
              <RiSparkling2Fill className="text-primary size-3.5 shrink-0" aria-hidden />
              <span className="text-foreground min-w-0 flex-1 truncate">
                Using the catalogue entry
                {linked.usageCount > 1 && ` · ${linked.usageCount} readers`}
              </span>
              <button
                type="button"
                onClick={unlink}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <RiCloseLine className="size-3.5" aria-hidden />
                Detach
              </button>
            </div>
          )}
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
