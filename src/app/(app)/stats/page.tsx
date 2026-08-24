import type { Metadata } from "next";
import { BookCheck, BookOpen, Flame, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/session";
import { plural } from "@/lib/format";
import { getLibraryStats } from "@/modules/stats/queries";

export const metadata: Metadata = { title: "Stats" };

const DAY_LABEL = new Intl.DateTimeFormat("en", { weekday: "short" });

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="bg-card border-border rounded-2xl border p-4">
      <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="tabular mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
    </div>
  );
}

export default async function StatsPage() {
  const user = await requireUser();
  const stats = await getLibraryStats(user.id);
  const peak = Math.max(1, ...stats.daily.map((day) => day.pages));
  const weekTotal = stats.daily.reduce((sum, day) => sum + day.pages, 0);

  return (
    <div>
      <PageHeader title="Stats" description="How the reading is actually going." />

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Pages this week" value={stats.pagesThisWeek} icon={BookOpen} />
        <Stat label="Day streak" value={stats.streak} icon={Flame} />
        <Stat label="Finished this year" value={stats.finishedThisYear} icon={BookCheck} />
        <Stat label="On the go" value={stats.activeBooks} icon={Layers} />
      </div>

      <section className="bg-card border-border mt-6 rounded-2xl border p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Last 7 days</h2>
          <p className="text-muted-foreground tabular text-xs">
            {plural(weekTotal, "page")}
          </p>
        </div>

        <div className="mt-5 flex items-end gap-1.5 sm:gap-3">
          {stats.daily.map((day) => (
            <div key={day.date.toISOString()} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-muted-foreground tabular text-[0.6875rem]">
                {day.pages > 0 ? day.pages : ""}
              </span>
              <div
                className={
                  day.pages > 0
                    ? "bg-primary w-full max-w-10 rounded-md transition-all"
                    : "bg-muted w-full max-w-10 rounded-md"
                }
                style={{ height: `${Math.max(6, (day.pages / peak) * 120)}px` }}
                aria-hidden
              />
              <span className="text-muted-foreground text-[0.6875rem]">
                {DAY_LABEL.format(day.date).slice(0, 2)}
              </span>
            </div>
          ))}
        </div>

        <p className="sr-only">
          {stats.daily
            .map((day) => `${day.date.toDateString()}: ${day.pages} pages`)
            .join(". ")}
        </p>
      </section>
    </div>
  );
}
