/* eslint-disable @next/next/no-img-element -- Covers are arbitrary user-supplied
   URLs. Routing them through next/image would mean whitelisting every possible
   remote host (or opening the optimizer to any host, which invites abuse). */
import { BookIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-16 w-11",
  md: "h-20 w-14",
  lg: "h-28 w-20 sm:h-40 sm:w-27",
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
        "bg-muted text-muted-foreground/60 ring-border/70 flex shrink-0 items-center justify-center overflow-hidden rounded-md shadow-sm ring-1",
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
        <BookIcon className="size-5" aria-hidden />
      )}
    </div>
  );
}
