"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { nextStartPage } from "@/modules/books/progress";
import { logProgress } from "@/modules/progress/actions";
import {
  logProgressFormSchema,
  type LogProgressFormValues,
} from "@/modules/progress/schema";

type BookSummary = {
  id: string;
  title: string;
  totalPages: number;
  currentPage: number;
};

/**
 * The interaction the whole product exists for.
 *
 * "From page" is pre-filled with `currentPage + 1`, so picking a book back up
 * after a month requires remembering nothing at all — the only thing left to
 * type is the page you stopped on.
 */
export function LogProgressDialog({
  book,
  trigger,
}: {
  book: BookSummary;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const resume = nextStartPage(book.currentPage, book.totalPages);

  const form = useForm<LogProgressFormValues>({
    resolver: zodResolver(logProgressFormSchema),
    defaultValues: {
      bookId: book.id,
      startPage: resume,
      endPage: Number.NaN,
      note: "",
      finished: false,
    },
  });

  // Reset to a clean, correctly pre-filled form each time it opens.
  useEffect(() => {
    if (open) {
      form.reset({
        bookId: book.id,
        startPage: resume,
        endPage: Number.NaN,
        note: "",
        finished: false,
      });
    }
  }, [open, book.id, resume, form]);

  const finished = useWatch({ control: form.control, name: "finished" });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await logProgress({
      bookId: values.bookId,
      startPage: values.startPage,
      endPage: values.finished ? book.totalPages : values.endPage,
      note: values.note,
      finished: values.finished,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setOpen(false);
    toast.success(
      values.finished
        ? `Finished ${book.title}.`
        : `Now on page ${result.data.currentPage} of ${book.title}.`,
    );
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="line-clamp-2 text-left leading-snug">
            {book.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {book.currentPage > 0
              ? `You left off on page ${book.currentPage} of ${book.totalPages}.`
              : "You haven't logged any pages yet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={Boolean(form.formState.errors.startPage)}>
                <FieldLabel htmlFor="startPage">From page</FieldLabel>
                <Input
                  id="startPage"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={book.totalPages}
                  className="tabular h-11 text-base sm:h-10 sm:text-sm"
                  aria-invalid={Boolean(form.formState.errors.startPage)}
                  {...form.register("startPage", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.startPage]} />
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.endPage)}>
                <FieldLabel htmlFor="endPage">To page</FieldLabel>
                <Input
                  id="endPage"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={book.totalPages}
                  autoFocus
                  disabled={finished}
                  className="tabular h-11 text-base sm:h-10 sm:text-sm"
                  aria-invalid={Boolean(form.formState.errors.endPage)}
                  {...form.register("endPage", { valueAsNumber: true })}
                />
                <FieldError errors={[form.formState.errors.endPage]} />
              </Field>
            </div>

            <p
              className={
                finished
                  ? "text-muted-foreground -mt-1 text-xs"
                  : "text-primary bg-primary/8 -mt-1 rounded-lg px-2.5 py-2 text-xs font-medium"
              }
            >
              {finished
                ? `Logging through to page ${book.totalPages}.`
                : `Starting from page ${resume} — right where you left off.`}
            </p>

            <Field>
              <FieldLabel htmlFor="note">Note (optional)</FieldLabel>
              <Textarea
                id="note"
                rows={2}
                placeholder="Anything worth remembering about this stretch?"
                {...form.register("note")}
              />
              <FieldError errors={[form.formState.errors.note]} />
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="finished"
                checked={finished}
                onCheckedChange={(checked) => {
                  const value = checked === true;
                  form.setValue("finished", value);
                  if (value) form.setValue("endPage", book.totalPages);
                }}
              />
              <FieldLabel htmlFor="finished" className="font-normal">
                I finished this book
              </FieldLabel>
            </Field>

            <Button
              type="submit"
              size="lg"
              className="mt-1 w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving…" : "Update"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
