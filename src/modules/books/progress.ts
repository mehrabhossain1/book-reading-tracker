/**
 * Pure reading-progress math. No I/O, no framework — every rule about "how far
 * am I" lives here so it can be tested directly and reused on client + server.
 */

export function clampPage(page: number, totalPages: number): number {
  if (!Number.isFinite(page)) return 0;
  return Math.min(Math.max(Math.trunc(page), 0), totalPages);
}

export function progressPercent(currentPage: number, totalPages: number): number {
  if (totalPages <= 0) return 0;
  return Math.min(100, Math.round((clampPage(currentPage, totalPages) / totalPages) * 100));
}

export function pagesRemaining(currentPage: number, totalPages: number): number {
  return Math.max(0, totalPages - clampPage(currentPage, totalPages));
}

/**
 * The page to resume from — the whole point of this app. Pre-fills the "from"
 * field of the log dialog so picking a book back up needs no recall at all.
 * A finished book resumes at its last page rather than past the end.
 */
export function nextStartPage(currentPage: number, totalPages: number): number {
  if (totalPages <= 0) return 1;
  const current = clampPage(currentPage, totalPages);
  return current >= totalPages ? totalPages : current + 1;
}

export function pagesInRange(startPage: number, endPage: number): number {
  return endPage - startPage + 1;
}

/** A session may re-cover old ground; the bookmark itself never moves backwards. */
export function advanceCurrentPage(
  currentPage: number,
  endPage: number,
  totalPages: number,
): number {
  return clampPage(Math.max(currentPage, endPage), totalPages);
}

export function isStale(lastReadAt: Date | null, now: Date, days = 14): boolean {
  if (!lastReadAt) return false;
  return now.getTime() - lastReadAt.getTime() > days * 24 * 60 * 60 * 1000;
}
