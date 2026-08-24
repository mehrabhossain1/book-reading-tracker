import {
  RiBarChartBoxFill,
  RiBookmark3Fill,
  RiHistoryFill,
  RiSearch2Fill,
  RiShieldCheckFill,
  RiStackFill,
} from "react-icons/ri";

import { Reveal } from "@/modules/marketing/components/reveal";

const FEATURES = [
  {
    icon: RiBookmark3Fill,
    title: "A bookmark per book",
    body: "Every book keeps its own page independently. Nothing is shared, nothing overwrites anything else.",
  },
  {
    icon: RiStackFill,
    title: "Pre-filled resume page",
    body: "Open the log and the starting page is already there — your last page, plus one. You never have to remember.",
  },
  {
    icon: RiHistoryFill,
    title: "An honest history",
    body: "Every sitting is appended, never edited. Re-read an earlier chapter and it is recorded without moving your bookmark backwards.",
  },
  {
    icon: RiBarChartBoxFill,
    title: "Pages, streaks, finishes",
    body: "Pages this week, your current streak and books finished this year — computed from the log, not self-reported.",
  },
  {
    icon: RiSearch2Fill,
    title: "A catalogue that builds itself",
    body: "Every book anyone adds becomes a suggestion for the next reader. Type three letters instead of three fields.",
  },
  {
    icon: RiShieldCheckFill,
    title: "Your data, your database",
    body: "Accounts live in your own Postgres with session cookies and per-user scoping enforced in the data layer.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-muted/45 section-y relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/textures/grid.svg')] bg-repeat opacity-[0.18]"
      />

      <div className="shell relative">
        <Reveal className="measure-wide">
          <p className="text-primary text-[0.8125rem] font-semibold tracking-[0.18em] uppercase">
            What you get
          </p>
          <h2 className="text-headline text-foreground mt-4 text-balance">
            Built around one <span className="font-serif italic">stubborn</span> detail.
          </h2>
          <p className="text-lead text-muted-foreground mt-5 text-pretty">
            Knowing the exact page to open to. Everything else follows from getting that right.
          </p>
        </Reveal>

        <Reveal
          stagger={0.08}
          className="mt-[clamp(2.5rem,4vw,4.5rem)] grid gap-[clamp(1rem,1.25vw,1.5rem)] sm:grid-cols-2 xl:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="group bg-card border-border hover:border-primary/40 relative overflow-hidden rounded-2xl border p-[clamp(1.375rem,1.7vw,2.15rem)] transition-colors"
            >
              <span
                aria-hidden
                className="via-primary/60 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
              <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
                <Icon className="size-[1.375rem]" aria-hidden />
              </span>
              <h3 className="text-title text-foreground mt-5">{title}</h3>
              <p className="text-muted-foreground mt-2.5 leading-relaxed text-pretty">{body}</p>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
