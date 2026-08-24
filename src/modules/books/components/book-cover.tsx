/* eslint-disable @next/next/no-img-element -- Covers are arbitrary user-supplied
   URLs. Routing them through next/image would mean whitelisting every possible
   remote host (or opening the optimizer to any host, which invites abuse). */
import { BookIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-14 w-10",
  md: "h-20 w-14",
  lg: "h-40 w-28",
} as const;

export function BookCover({
  title,
  coverUrl,
  size = "sm",
  className,
}: {
  title: string;
  coverUrl: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground border-border/60 flex shrink-0 items-center justify-center overflow-hidden rounded-sm border",
        SIZES[size],
        className,
      )}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`Cover of ${title}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <BookIcon className="size-4" aria-hidden />
      )}
    </div>
  );
}
