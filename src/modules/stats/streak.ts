/** Local-time day key, so a session at 11pm and one at 1am are different days. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Consecutive days with at least one logged session, counting back from today.
 * Yesterday still counts as alive — today isn't over yet, and punishing someone
 * at 00:01 for not having read yet is hostile.
 */
export function currentStreak(readDates: Date[], now: Date = new Date()): number {
  if (readDates.length === 0) return 0;
  const days = new Set(readDates.map(dayKey));

  let cursor = days.has(dayKey(now))
    ? now
    : days.has(dayKey(addDays(now, -1)))
      ? addDays(now, -1)
      : null;
  if (!cursor) return 0;

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function startOfWeek(now: Date = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  // Monday-first
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

export function lastNDays(n: number, now: Date = new Date()): Date[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}
