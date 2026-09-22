"use client";

import { useLinkStatus } from "next/link";

import { cn } from "@/lib/utils";

/**
 * Inline feedback for a link whose destination isn't prefetched yet.
 *
 * Must render inside a <Link>. Always in the DOM and fixed-size, toggled by
 * opacity only — so it can never shift layout. The opacity transition has a
 * 100ms delay: a navigation that finishes faster than that never shows the bar
 * at all, which is the "don't flash" behaviour without paying React's 300ms
 * Suspense throttle. Under reduced motion the sweep stops and the bar just shows.
 */
export function LinkPendingBar({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      data-pending={pending || undefined}
      className={cn(
        "pointer-events-none absolute inset-x-4 top-0 z-20 h-0.5 overflow-hidden rounded-full opacity-0 transition-opacity duration-150",
        pending && "opacity-100 delay-100",
        className,
      )}
    >
      <span className="bg-primary animate-link-pending block h-full w-1/3 rounded-full" />
    </span>
  );
}
