"use client";

import { formatRelative } from "@/lib/format";

/**
 * "3 days ago" depends on the clock, and the server's clock and the browser's
 * are read a few hundred ms apart — so the text can legitimately differ between
 * the server render and hydration. suppressHydrationWarning scopes that
 * tolerance to this one text node instead of hiding real mismatches elsewhere.
 */
export function RelativeTime({
  iso,
  prefix = "",
  fallback,
  className,
}: {
  iso: string | null;
  prefix?: string;
  fallback: string;
  className?: string;
}) {
  if (!iso) return <span className={className}>{fallback}</span>;
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {prefix}
      {formatRelative(iso)}
    </time>
  );
}
