"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { BookStatus } from "@/db/schema";
import { ActionFailure } from "@/lib/api-client";
import { queryKeys } from "@/lib/query/keys";
import { deleteBook, setBookStatus } from "@/modules/books/actions";
import type { BookDTO, BookDetailDTO, LibraryDTO } from "@/modules/books/dto";
import {
  applyProgress,
  applyStatus,
  optimisticSession,
  removeBook,
  replaceBook,
  type ProgressInput,
} from "@/modules/books/library";
import { pendingDeletes } from "@/modules/books/pending-deletes";
import { BOOK_STATUS_META } from "@/modules/books/status";
import { logProgress } from "@/modules/progress/actions";

/**
 * All shelf writes share a mutation key so that, when several fire in quick
 * succession, only the last one to settle triggers a refetch. Refetching after
 * each would briefly show the server's view of an earlier write *under* a later
 * optimistic one — the list would flicker backwards.
 */
const WRITE_KEY = ["books", "write"] as const;

type Snapshot = { library?: LibraryDTO; detail?: BookDetailDTO | null };

function snapshot(qc: QueryClient, bookId: string): Snapshot {
  return {
    library: qc.getQueryData<LibraryDTO>(queryKeys.library),
    detail: qc.getQueryData<BookDetailDTO | null>(queryKeys.book(bookId)),
  };
}

function restore(qc: QueryClient, bookId: string, snap: Snapshot | undefined) {
  if (!snap) return;
  if (snap.library) qc.setQueryData(queryKeys.library, snap.library);
  if (snap.detail !== undefined) qc.setQueryData(queryKeys.book(bookId), snap.detail);
}

/** The freshest copy of a book the cache holds, from either query. */
function findBook(qc: QueryClient, bookId: string): BookDTO | undefined {
  return (
    qc.getQueryData<LibraryDTO>(queryKeys.library)?.books.find((b) => b.id === bookId) ??
    qc.getQueryData<BookDetailDTO | null>(queryKeys.book(bookId))?.book
  );
}

function writeBook(qc: QueryClient, next: BookDTO) {
  qc.setQueryData<LibraryDTO>(queryKeys.library, (old) =>
    old ? { books: replaceBook(old.books, next) } : old,
  );
  qc.setQueryData<BookDetailDTO | null>(queryKeys.book(next.id), (old) =>
    old ? { ...old, book: next } : old,
  );
}

async function holdQueries(qc: QueryClient, bookId: string) {
  // An in-flight refetch landing after the optimistic write would overwrite it
  // with pre-mutation data.
  await Promise.all([
    qc.cancelQueries({ queryKey: queryKeys.library }),
    qc.cancelQueries({ queryKey: queryKeys.book(bookId) }),
  ]);
}

function reconcile(qc: QueryClient, bookId: string) {
  if (qc.isMutating({ mutationKey: WRITE_KEY }) > 1) return;
  void qc.invalidateQueries({ queryKey: queryKeys.library });
  void qc.invalidateQueries({ queryKey: queryKeys.book(bookId) });
  void qc.invalidateQueries({ queryKey: queryKeys.stats });
}

async function unwrap<T>(result: Promise<{ ok: true; data: T } | { ok: false; error: string }>) {
  const settled = await result;
  if (!settled.ok) throw new ActionFailure(settled.error);
  return settled.data;
}

export type LogProgressVariables = ProgressInput & { bookId: string; title: string };

export function useLogProgress() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: WRITE_KEY,
    mutationFn: (v: LogProgressVariables) =>
      unwrap(
        logProgress({
          bookId: v.bookId,
          startPage: v.startPage,
          endPage: v.endPage,
          note: v.note ?? "",
          finished: v.finished,
        }),
      ),

    onMutate: async (v) => {
      await holdQueries(qc, v.bookId);
      const snap = snapshot(qc, v.bookId);
      const current = findBook(qc, v.bookId);

      if (current) {
        const now = new Date().toISOString();
        const next = applyProgress(current, v, now);
        writeBook(qc, next);
        qc.setQueryData<BookDetailDTO | null>(queryKeys.book(v.bookId), (old) =>
          old ? { ...old, sessions: [optimisticSession(current, v, now), ...old.sessions] } : old,
        );
        // Confirm on tap, not on server round trip — the rollback below
        // replaces this with an error if the write is refused.
        toast.success(
          v.finished ? `Finished ${v.title}.` : `Now on page ${next.currentPage} of ${v.title}.`,
          { id: `progress-${v.bookId}` },
        );
      }
      return { snap };
    },

    onError: (error, v, context) => {
      restore(qc, v.bookId, context?.snap);
      toast.error(error instanceof ActionFailure ? error.message : "That didn't save. Try again.", {
        id: `progress-${v.bookId}`,
      });
    },

    onSettled: (_data, _error, v) => reconcile(qc, v.bookId),
  });
}

export function useSetBookStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: WRITE_KEY,
    mutationFn: (v: { bookId: string; status: BookStatus }) => unwrap(setBookStatus(v)),

    onMutate: async (v) => {
      await holdQueries(qc, v.bookId);
      const snap = snapshot(qc, v.bookId);
      const current = findBook(qc, v.bookId);
      if (current) {
        writeBook(qc, applyStatus(current, v.status, new Date().toISOString()));
        toast.success(`Moved to ${BOOK_STATUS_META[v.status].label}.`, { id: `status-${v.bookId}` });
      }
      return { snap };
    },

    onError: (error, v, context) => {
      restore(qc, v.bookId, context?.snap);
      toast.error(error instanceof ActionFailure ? error.message : "That didn't save. Try again.", {
        id: `status-${v.bookId}`,
      });
    },

    onSettled: (_data, _error, v) => reconcile(qc, v.bookId),
  });
}

const UNDO_WINDOW_MS = 5000;

/**
 * Delete with Undo, after Netflix / Gmail: the book leaves the UI at once, and
 * the server delete is only sent once the Undo window closes.
 *
 * If the tab is closed inside the window the delete is never sent. That is the
 * safe way round to fail: a book you meant to delete survives, rather than one
 * you meant to keep vanishing along with its whole reading history.
 */
export function useDeleteBookWithUndo() {
  const qc = useQueryClient();

  return (book: BookDTO) => {
    const snap = snapshot(qc, book.id);
    let settled = false;

    pendingDeletes.set(book.id, book.status);
    qc.setQueryData<LibraryDTO>(queryKeys.library, (old) =>
      old ? { books: removeBook(old.books, book.id) } : old,
    );

    const undo = () => {
      if (settled) return;
      settled = true;
      pendingDeletes.delete(book.id);
      restore(qc, book.id, snap);
      toast.success(`Kept ${book.title}.`, { id: `delete-${book.id}` });
    };

    const commit = async () => {
      if (settled) return;
      settled = true;
      const result = await deleteBook({ bookId: book.id });
      pendingDeletes.delete(book.id);
      if (!result.ok) {
        restore(qc, book.id, snap);
        toast.error(result.error);
      }
      qc.removeQueries({ queryKey: queryKeys.book(book.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.library });
      void qc.invalidateQueries({ queryKey: queryKeys.stats });
    };

    toast(`Deleted ${book.title}`, {
      id: `delete-${book.id}`,
      description: "Its reading history goes with it.",
      duration: UNDO_WINDOW_MS,
      action: { label: "Undo", onClick: undo },
      onAutoClose: () => void commit(),
      // Swiping the toast away means "yes, I'm sure" — send it now.
      onDismiss: () => void commit(),
    });
  };
}
