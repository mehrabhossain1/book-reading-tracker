"use client";

import { useRef } from "react";
import { RiBookmarkFill, RiCheckboxCircleFill, RiSearch2Fill, RiSparkling2Fill } from "react-icons/ri";

import { Reveal } from "@/modules/marketing/components/reveal";
import { MOTION_OK, gsap, useGSAP } from "@/modules/marketing/gsap";

const MATCHES = [
  { title: "The Power Broker", meta: "Robert A. Caro · 1246 pages · 214 readers", onShelf: false },
  { title: "The Power of Habit", meta: "Charles Duhigg · 371 pages · 96 readers", onShelf: false },
  { title: "Power and Progress", meta: "Acemoglu & Johnson · 546 pages · 12 readers", onShelf: true },
];

const POINTS = [
  {
    title: "Type three letters",
    body: "The catalogue is searched as you type, with the results debounced so it stays quiet while you think.",
  },
  {
    title: "Typos still find it",
    body: "Trigram matching in Postgres means “powr brokr” finds The Power Broker. Any script — Latin, Bengali, anything.",
  },
  {
    title: "Details fill themselves in",
    body: "Pick a match and the author, page count and cover arrive with it. Your progress stays entirely your own.",
  },
];

export function Catalogue() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        // The result rows drop in one after another, the way they arrive.
        gsap.from("[data-cat='row']", {
          y: 14,
          opacity: 0,
          duration: 0.5,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-cat='panel']", start: "top 78%", once: true },
        });
        gsap.from("[data-cat='caret']", {
          scaleY: 0,
          duration: 0.35,
          repeat: -1,
          yoyo: true,
          ease: "none",
          scrollTrigger: { trigger: "[data-cat='panel']", start: "top 85%" },
        });
      });
      return () => media.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} id="catalogue" className="bg-muted/45 section-y relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/textures/noise.svg')] bg-repeat opacity-[0.04]"
      />

      <div className="shell relative grid items-center gap-[clamp(2.5rem,4vw,5rem)] lg:grid-cols-2">
        <Reveal>
          <p className="text-primary text-[0.8125rem] font-semibold tracking-[0.18em] uppercase">
            Shared catalogue
          </p>
          <h2 className="text-headline text-foreground mt-4 max-w-[15ch] text-balance">
            Add a book once. <span className="font-serif italic">Everyone</span> skips the typing.
          </h2>
          <p className="text-lead text-muted-foreground measure mt-6 text-pretty">
            Every book anyone adds joins a shared catalogue. The next person to reach for it
            gets it as a suggestion instead of retyping the title, author and page count.
          </p>

          <dl className="mt-8 space-y-5">
            {POINTS.map((point) => (
              <div key={point.title} className="flex gap-3">
                <RiCheckboxCircleFill
                  className="text-primary mt-0.5 size-5 shrink-0"
                  aria-hidden
                />
                <div>
                  <dt className="text-foreground font-medium">{point.title}</dt>
                  <dd className="text-muted-foreground mt-1 leading-relaxed text-pretty">
                    {point.body}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* A still of the real combobox. */}
        <div data-cat="panel" aria-hidden className="relative">
          {/* Capped so it still reads as a form, not a full-width table. */}
          <div className="bg-card border-border mx-auto w-full max-w-[34rem] rounded-2xl border p-4 shadow-xl shadow-black/5 sm:p-5 lg:mr-0">
            <p className="text-muted-foreground text-[0.8125rem] font-medium">Title</p>

            <div className="border-primary/50 ring-primary/15 mt-1.5 flex items-center gap-2 rounded-lg border bg-transparent px-3 py-2.5 ring-4">
              <RiSearch2Fill className="text-muted-foreground size-4 shrink-0" />
              <span className="text-foreground text-sm">The Power</span>
              <span data-cat="caret" className="bg-primary inline-block h-4 w-px" />
            </div>

            <div className="border-border mt-2 overflow-hidden rounded-xl border">
              <p className="text-muted-foreground border-border/70 border-b px-3 py-2 text-[0.6875rem] tracking-wide uppercase">
                Already in the catalogue
              </p>

              <ul className="divide-border/60 divide-y">
                {MATCHES.map((match) => (
                  <li
                    key={match.title}
                    data-cat="row"
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <span className="bg-muted text-muted-foreground ring-border/70 flex h-11 w-8 shrink-0 items-center justify-center rounded ring-1">
                      <RiBookmarkFill className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        <mark className="bg-primary/20 text-foreground rounded-[3px] px-0.5">
                          The Power
                        </mark>
                        {match.title.slice("The Power".length)}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {match.meta}
                      </span>
                    </span>
                    {match.onShelf && (
                      <span className="text-success inline-flex shrink-0 items-center gap-1 text-[0.6875rem] font-medium">
                        <RiCheckboxCircleFill className="size-3.5" />
                        On your shelf
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <p className="text-muted-foreground border-border/70 border-t px-3 py-2 text-[0.6875rem]">
                ↑ ↓ to navigate · ↵ to use · keep typing to add a new one
              </p>
            </div>

            <div className="border-primary/30 bg-primary/8 mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs">
              <RiSparkling2Fill className="text-primary size-3.5 shrink-0" />
              <span className="text-foreground">Using the catalogue entry · 214 readers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
