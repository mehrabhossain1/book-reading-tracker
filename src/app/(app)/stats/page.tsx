import type { Metadata } from "next";

import { requireUser } from "@/lib/session";
import { getLibraryStats } from "@/modules/stats/queries";

export const metadata: Metadata = { title: "Stats" };

const DAY_LABEL = new Intl.DateTimeFormat("en", { weekday: "narrow" });

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-border rounded-lg border px-4 py-3">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default async function StatsPage() {
  const user = await requireUser();
  const stats = await getLibraryStats(user.id);
  const peak = Math.max(1, ...stats.daily.map((day) => day.pages));

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Stats</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pages this week" value={stats.pagesThisWeek} />
        <Stat label="Day streak" value={stats.streak} />
        <Stat label="Finished this year" value={stats.finishedThisYear} />
        <Stat label="On the go" value={stats.activeBooks} />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium">Last 7 days</h2>
        <div className="mt-4 flex items-end gap-2">
          {stats.daily.map((day) => (
            <div key={day.date.toISOString()} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-muted-foreground text-xs tabular-nums">
                {day.pages > 0 ? day.pages : ""}
              </span>
              <div
                className={day.pages > 0 ? "bg-foreground w-full rounded-sm" : "bg-muted w-full rounded-sm"}
                style={{ height: `${Math.max(4, (day.pages / peak) * 96)}px` }}
                aria-hidden
              />
              <span className="text-muted-foreground text-xs">{DAY_LABEL.format(day.date)}</span>
            </div>
          ))}
        </div>
        <p className="sr-only">
          {stats.daily.map((day) => `${day.date.toDateString()}: ${day.pages} pages`).join(". ")}
        </p>
      </section>
    </div>
  );
}
