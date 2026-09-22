import type { BookStatus } from "@/db/schema";

/**
 * Books removed from the UI whose server delete hasn't been sent yet — they're
 * inside the Undo window.
 *
 * Needed because the cache can be refetched during that window (tab refocus,
 * another mutation settling), and the server still has the book. Without this,
 * a deleted book would reappear mid-Undo.
 */
export const pendingDeletes = new Map<string, BookStatus>();
