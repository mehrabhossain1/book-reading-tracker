"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { BookCheck, BookOpen, Flame, Layers } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatTile } from "@/components/stat-tile";
import { plural } from "@/lib/format";
import { statsQuery } from "@/modules/books/query-options";

export function StatsView() {
  const { data: stats } = useSuspenseQuery(statsQuery());
  const peak = Math.max(1, ...stats.daily.map((day) => day.pages));
  const weekTotal = stats.daily.reduce((sum, day) => sum + day.pages, 0);

  return (
    <div>
      <PageHeader title="Stats" description="How the reading is actually going." />

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Pages this week" value={stats.pagesThisWeek} icon={BookOpen} />
        <StatTile label="Day streak" value={stats.streak} icon={Flame} />
        <StatTile label="Finished this year" value={stats.finishedThisYear} icon={BookCheck} />
        <StatTile label="On the go" value={stats.activeBooks} icon={Layers} />
      </div>

      <section className="bg-card border-border mt-6 rounded-2xl border p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Last 7 days</h2>
          <p className="text-muted-foreground tabular text-xs">{plural(weekTotal, "page")}</p>
        </div>

        <div className="mt-5 flex items-end gap-1.5 sm:gap-3">
          {stats.daily.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-muted-foreground tabular text-[0.6875rem]">
                {day.pages > 0 ? day.pages : ""}
              </span>
              <div
                className={
                  day.pages > 0
                    ? "bg-primary w-full max-w-10 rounded-md transition-[height] duration-300"
                    : "bg-muted w-full max-w-10 rounded-md"
                }
                style={{ height: `${Math.max(6, (day.pages / peak) * 120)}px` }}
                aria-hidden
              />
              <span className="text-muted-foreground text-[0.6875rem]">{day.label}</span>
            </div>
          ))}
        </div>

        <p className="sr-only">{stats.daily.map((day) => `${day.label}: ${day.pages} pages`).join(". ")}</p>
      </section>
    </div>
  );
}
