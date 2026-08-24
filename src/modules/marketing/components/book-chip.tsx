import { RiBookmarkFill, RiCheckboxCircleFill } from "react-icons/ri";

import { cn } from "@/lib/utils";

/** A miniature of the real library row, used as hero furniture. */
export function BookChip({
  title,
  author,
  page,
  total,
  finished = false,
  className,
}: {
  title: string;
  author: string;
  page: number;
  total: number;
  finished?: boolean;
  className?: string;
}) {
  const percent = Math.round((page / total) * 100);

  return (
    <div
      className={cn(
        "bg-cream/97 w-[clamp(14rem,17vw,19rem)] rounded-2xl p-[clamp(0.875rem,1vw,1.15rem)] shadow-2xl shadow-black/35 backdrop-blur",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="bg-ember/15 text-ember flex size-9 shrink-0 items-center justify-center rounded-lg">
          {finished ? (
            <RiCheckboxCircleFill className="size-4" aria-hidden />
          ) : (
            <RiBookmarkFill className="size-4" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-ink truncate text-[0.875rem] leading-tight font-semibold">{title}</p>
          <p className="text-ink/55 truncate text-[0.75rem]">{author}</p>
        </div>
      </div>

      <div className="bg-ink/10 mt-3 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", finished ? "bg-success" : "bg-ember")}
          style={{ width: `${finished ? 100 : percent}%` }}
        />
      </div>

      <p className="text-ink/60 mt-2 text-[0.75rem] font-medium tabular-nums">
        {finished ? `Finished · ${total} pages` : `p. ${page} of ${total}`}
      </p>
    </div>
  );
}
