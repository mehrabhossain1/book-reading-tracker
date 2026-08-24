"use client";

import { useRef } from "react";
import { RiArrowRightLine, RiBarChartBoxFill, RiBookOpenFill, RiSettings4Fill } from "react-icons/ri";

import { Reveal } from "@/modules/marketing/components/reveal";
import { MOTION_OK, gsap, useGSAP } from "@/modules/marketing/gsap";

const ROWS = [
  { title: "The Power Broker", author: "Robert A. Caro", page: 380, total: 1246 },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", page: 142, total: 499 },
  { title: "The Pragmatic Programmer", author: "Hunt & Thomas", page: 96, total: 352 },
];

export function Showcase() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        // The mock starts tipped away and straightens as it reaches centre —
        // it reads as the product rising to meet you.
        gsap.fromTo(
          "[data-showcase='frame']",
          { rotateX: 24, scale: 0.9, y: 60, opacity: 0.65 },
          {
            rotateX: 0,
            scale: 1,
            y: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: scope.current,
              start: "top 82%",
              end: "center 58%",
              scrub: 0.7,
            },
          },
        );
      });
      return () => media.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} className="bg-ink section-y relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/textures/grid.svg')] bg-repeat opacity-[0.1]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, oklch(0.5 0.13 55 / 0.35), transparent 70%)",
        }}
      />

      <div className="shell relative">
        <Reveal className="measure-wide mx-auto text-center">
          <p className="text-ember text-[0.8125rem] font-semibold tracking-[0.18em] uppercase">
            The library
          </p>
          <h2 className="text-headline text-cream mt-4 text-balance">
            Every book, every page, <span className="font-serif italic">at a glance</span>.
          </h2>
        </Reveal>

        {/* Perspective lives on the parent so the child can rotate in 3D. */}
        <div
          className="mt-[clamp(2.5rem,4vw,4.5rem)] [perspective:1600px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            data-showcase="frame"
            aria-hidden
            className="border-ink-line/70 bg-background will-animate mx-auto w-full max-w-[76rem] overflow-hidden rounded-[clamp(1rem,1.2vw,1.5rem)] border shadow-2xl shadow-black/50"
          >
            <div className="flex">
              {/* Sidebar */}
              <div className="bg-sidebar border-sidebar-border hidden w-[clamp(9rem,12vw,15rem)] shrink-0 flex-col gap-1 border-r p-4 sm:flex">
                <div className="mb-4 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
                    <RiBookOpenFill className="size-3.5" />
                  </span>
                  <span className="text-foreground text-[0.8125rem] font-semibold">Book Tracker</span>
                </div>
                <span className="bg-sidebar-accent text-foreground flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium">
                  <RiBookOpenFill className="text-primary size-4" /> Library
                </span>
                <span className="text-muted-foreground flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.8125rem]">
                  <RiBarChartBoxFill className="size-4" /> Stats
                </span>
                <span className="text-muted-foreground flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.8125rem]">
                  <RiSettings4Fill className="size-4" /> Settings
                </span>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 p-[clamp(1rem,1.6vw,2rem)]">
                <div className="flex items-baseline justify-between">
                  <p className="text-foreground text-[clamp(1rem,1.3vw,1.5rem)] font-semibold">
                    Library
                  </p>
                  <span className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-[0.75rem] font-medium">
                    Add a book
                  </span>
                </div>

                <div className="bg-muted mt-4 inline-flex gap-1 rounded-xl p-1">
                  {["Reading 3", "Want to read 1", "Finished 1"].map((tab, i) => (
                    <span
                      key={tab}
                      className={
                        i === 0
                          ? "bg-card text-foreground rounded-lg px-3 py-1.5 text-[0.75rem] font-medium shadow-sm"
                          : "text-muted-foreground rounded-lg px-3 py-1.5 text-[0.75rem]"
                      }
                    >
                      {tab}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {ROWS.map((row) => {
                    const percent = Math.round((row.page / row.total) * 100);
                    return (
                      <div key={row.title} className="bg-card border-border rounded-xl border p-3.5">
                        <div className="flex items-start gap-3">
                          <span className="bg-muted ring-border/70 h-14 w-10 shrink-0 rounded-md ring-1" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-foreground truncate text-[0.8125rem] font-medium">
                                {row.title}
                              </p>
                              <span className="text-muted-foreground text-[0.6875rem] tabular-nums">
                                {percent}%
                              </span>
                            </div>
                            <p className="text-muted-foreground truncate text-[0.75rem]">
                              {row.author}
                            </p>
                            <div className="bg-muted mt-2.5 h-1.5 overflow-hidden rounded-full">
                              <div
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <p className="text-muted-foreground mt-2 text-[0.6875rem] tabular-nums">
                              p. {row.page} of {row.total}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="bg-card border-primary/40 flex items-center gap-3 rounded-xl border p-3.5">
                    <span className="bg-muted ring-border/70 h-11 w-8 shrink-0 rounded-md ring-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-primary text-[0.625rem] font-semibold tracking-wide uppercase">
                        Continue reading
                      </p>
                      <p className="text-foreground truncate text-[0.8125rem] font-medium">
                        The Power Broker
                      </p>
                      <p className="text-muted-foreground text-[0.6875rem]">resume on page 381</p>
                    </div>
                    <span className="bg-primary text-primary-foreground flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium">
                      p.381 <RiArrowRightLine className="size-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
