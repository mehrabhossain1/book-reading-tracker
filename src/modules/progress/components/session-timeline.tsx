import type { ReadingSession } from "@/db/schema";
import { formatRelative, plural } from "@/lib/format";

export function SessionTimeline({
  sessions,
  now = new Date(),
}: {
  sessions: ReadingSession[];
  now?: Date;
}) {
  if (sessions.length === 0) {
    return (
      <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-8 text-center text-sm">
        No sessions logged yet. The first one starts the history.
      </p>
    );
  }

  return (
    <ol className="relative">
      {sessions.map((session, index) => (
        <li key={session.id} className="relative flex gap-3.5 pb-5 last:pb-0">
          {/* Timeline spine + node */}
          <div className="flex flex-col items-center">
            <span className="bg-primary/15 ring-primary/30 mt-1 size-2.5 shrink-0 rounded-full ring-2" />
            {index < sessions.length - 1 && (
              <span className="bg-border mt-1 w-px flex-1" aria-hidden />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="tabular text-sm font-medium">
                +{plural(session.pagesRead, "page")}
              </span>
              <span className="text-muted-foreground tabular text-xs">
                pages {session.startPage}–{session.endPage}
              </span>
              <span className="text-muted-foreground ml-auto text-xs">
                {formatRelative(session.readAt, now)}
              </span>
            </div>
            {session.note && (
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed text-pretty">
                {session.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
