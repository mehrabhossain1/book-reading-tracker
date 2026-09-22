import { RelativeTime } from "@/components/relative-time";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SessionDTO } from "@/modules/books/dto";

export function SessionTimeline({ sessions }: { sessions: SessionDTO[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-8 text-center text-sm">
        No sessions logged yet. The first one starts the history.
      </p>
    );
  }

  return (
    <ol className="relative">
      {sessions.map((session, index) => {
        // Not yet confirmed by the server — shown immediately, but quieter.
        const pending = session.id.startsWith("optimistic-");
        return (
          <li
            key={session.id}
            className={cn("relative flex gap-3.5 pb-5 transition-opacity last:pb-0", pending && "opacity-60")}
            aria-busy={pending || undefined}
          >
            <div className="flex flex-col items-center">
              <span className="bg-primary/15 ring-primary/30 mt-1 size-2.5 shrink-0 rounded-full ring-2" />
              {index < sessions.length - 1 && <span className="bg-border mt-1 w-px flex-1" aria-hidden />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="tabular text-sm font-medium">+{plural(session.pagesRead, "page")}</span>
                <span className="text-muted-foreground tabular text-xs">
                  pages {session.startPage}–{session.endPage}
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {pending ? "Saving…" : <RelativeTime iso={session.readAt} fallback="" />}
                </span>
              </div>
              {session.note && (
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed text-pretty">{session.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
