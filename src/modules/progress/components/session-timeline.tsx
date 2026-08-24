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
      <p className="text-muted-foreground text-sm">
        No sessions logged yet. The first one starts the history.
      </p>
    );
  }

  return (
    <ol className="border-border/70 divide-border/70 divide-y border-t">
      {sessions.map((session) => (
        <li key={session.id} className="py-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
            <span className="font-medium">+{plural(session.pagesRead, "page")}</span>
            <span className="text-muted-foreground text-xs">
              pages {session.startPage}–{session.endPage}
            </span>
            <span className="text-muted-foreground ml-auto text-xs">
              {formatRelative(session.readAt, now)}
            </span>
          </div>
          {session.note && (
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              {session.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
