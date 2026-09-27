import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The one way an attached book file is opened, used by the library row and the
 * book page so both behave identically.
 *
 * A plain <a>, not next/link: the target is somebody's Drive file or PDF host,
 * and the router has nothing to do with it. `rel="noreferrer"` keeps the
 * reader's shelf URL out of that host's logs, and `noopener` stops the opened
 * tab reaching back into this one via window.opener. The href itself is
 * guaranteed http(s) by the schema (see modules/books/schema.ts) — this
 * component must never be handed an unvalidated URL.
 *
 *   button — labelled, for the book page
 *   icon   — square, for the tight library row
 */
export function BookFileLink({
  url,
  variant = "button",
  label = "Open file",
  className,
}: {
  url: string;
  variant?: "button" | "icon";
  label?: string;
  className?: string;
}) {
  const icon = variant === "icon";

  return (
    <Button
      asChild
      variant="outline"
      size={icon ? "icon-sm" : "lg"}
      className={cn(!icon && "gap-1.5", className)}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={icon ? label : undefined}
        title={icon ? label : undefined}
      >
        <ExternalLink className={icon ? "size-3.5" : "size-4"} aria-hidden />
        {!icon && label}
      </a>
    </Button>
  );
}
