import Link from "next/link";
import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({
  showWordmark = true,
  className,
}: {
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/library"
      className={cn("flex items-center gap-2.5 rounded-lg", className)}
      aria-label="Book Tracker"
    >
      <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
        <BookOpen className="size-4" aria-hidden />
      </span>
      {showWordmark && (
        <span className="text-[0.9375rem] font-semibold tracking-tight">Book Tracker</span>
      )}
    </Link>
  );
}
