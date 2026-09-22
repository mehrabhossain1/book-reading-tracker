"use client";

import Link from "next/link";
import { Check, MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BookDTO } from "@/modules/books/dto";
import { useDeleteBookWithUndo, useSetBookStatus } from "@/modules/books/use-book-mutations";

export function BookActionsMenu({
  book,
  onBeforeDelete,
}: {
  book: BookDTO;
  /** e.g. leave the detail page before the book disappears from under it. */
  onBeforeDelete?: () => void;
}) {
  const setStatus = useSetBookStatus();
  const deleteWithUndo = useDeleteBookWithUndo();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Book options">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/books/${book.id}/edit`}>
            <Pencil className="size-4" />
            Edit
          </Link>
        </DropdownMenuItem>

        {book.status !== "finished" && (
          <DropdownMenuItem onSelect={() => setStatus.mutate({ bookId: book.id, status: "finished" })}>
            <Check className="size-4" />
            Mark finished
          </DropdownMenuItem>
        )}

        {book.status === "reading" ? (
          <DropdownMenuItem onSelect={() => setStatus.mutate({ bookId: book.id, status: "paused" })}>
            <Pause className="size-4" />
            Pause
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => setStatus.mutate({ bookId: book.id, status: "reading" })}>
            <Play className="size-4" />
            Move to reading
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        {/* No confirm() any more: the Undo toast is the safety net, and a
            blocking browser dialog was the one jarring moment in the app. */}
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            onBeforeDelete?.();
            deleteWithUndo(book);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
