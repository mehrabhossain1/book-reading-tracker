import { BOOK_STATUSES, type BookStatus } from "@/db/schema";

type StatusMeta = {
  label: string;
  /** Shown as the library tab's empty state. */
  emptyTitle: string;
  emptyBody: string;
};

/**
 * The single source of truth for every book status.
 *
 * The library tabs, the status dropdown and the empty states all read from
 * here. Keeping these in separate hand-maintained lists is exactly how
 * `want_to_read` and `abandoned` became selectable-but-invisible: you could
 * create a book you were then unable to find. The `satisfies Record<BookStatus, …>`
 * below makes that a compile error rather than a bug report.
 */
export const BOOK_STATUS_META = {
  reading: {
    label: "Reading",
    emptyTitle: "Nothing on the go",
    emptyBody:
      "Add a book and log the page you're on. Next time you pick it up, the page to resume from will already be filled in.",
  },
  want_to_read: {
    label: "Want to read",
    emptyTitle: "No books queued up",
    emptyBody:
      "Books you plan to start live here. Log any progress and they move to Reading on their own.",
  },
  paused: {
    label: "Paused",
    emptyTitle: "No paused books",
    emptyBody:
      "Books you set aside show up here, with your place kept exactly where you left it.",
  },
  finished: {
    label: "Finished",
    emptyTitle: "No finished books yet",
    emptyBody: "Books you complete land here.",
  },
  abandoned: {
    label: "Abandoned",
    emptyTitle: "Nothing abandoned",
    emptyBody: "Books you decided not to finish end up here. No judgement.",
  },
} satisfies Record<BookStatus, StatusMeta>;

/** Tab order — deliberately not the enum's order, which is storage order. */
export const STATUS_ORDER = [
  "reading",
  "want_to_read",
  "paused",
  "finished",
  "abandoned",
] as const satisfies readonly BookStatus[];

export const statusLabel = (status: BookStatus) => BOOK_STATUS_META[status].label;

export function isBookStatus(value: unknown): value is BookStatus {
  return typeof value === "string" && (BOOK_STATUSES as readonly string[]).includes(value);
}
