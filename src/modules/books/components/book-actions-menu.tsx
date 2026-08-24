"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { Check, MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BookStatus } from "@/db/schema";
import { deleteBook, setBookStatus } from "@/modules/books/actions";

export function BookActionsMenu({
  bookId,
  status,
  onDeleted,
}: {
  bookId: string;
  status: BookStatus;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error ?? "That didn't work.");
        return;
      }
      toast.success(success);
      router.refresh();
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={isPending} aria-label="Book options">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/books/${bookId}`}>
            <Pencil className="size-4" />
            Open
          </Link>
        </DropdownMenuItem>

        {status !== "finished" && (
          <DropdownMenuItem
            onSelect={() =>
              run(() => setBookStatus({ bookId, status: "finished" }), "Marked as finished.")
            }
          >
            <Check className="size-4" />
            Mark finished
          </DropdownMenuItem>
        )}

        {status === "reading" ? (
          <DropdownMenuItem
            onSelect={() => run(() => setBookStatus({ bookId, status: "paused" }), "Paused.")}
          >
            <Pause className="size-4" />
            Pause
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() =>
              run(() => setBookStatus({ bookId, status: "reading" }), "Back on the pile.")
            }
          >
            <Play className="size-4" />
            Move to reading
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            if (!confirm("Delete this book and its whole reading history?")) return;
            run(() => deleteBook({ bookId }), "Book deleted.");
            onDeleted?.();
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
