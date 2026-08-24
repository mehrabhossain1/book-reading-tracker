"use client";

import { useRef } from "react";
import { RiBookmark3Fill, RiQuestionFill, RiTimeFill } from "react-icons/ri";

import { Reveal } from "@/modules/marketing/components/reveal";
import { MOTION_OK, gsap, useGSAP } from "@/modules/marketing/gsap";

const PAINS = [
  {
    icon: RiQuestionFill,
    title: "Which page was I on?",
    body: "A physical bookmark works for one book. Five books means five bookmarks and no memory of any of them.",
  },
  {
    icon: RiTimeFill,
    title: "Which book have I neglected?",
    body: "The book you put down in March is the one you forget entirely. Nothing tells you it has gone quiet.",
  },
  {
    icon: RiBookmark3Fill,
    title: "Did I actually read this week?",
    body: "Without a record, a good month and a bad month feel identical in hindsight.",
  },
];

/**
 * A hand of book spines. Each pivots from a shared point at the bottom, which
 * is what makes it read as one fan rather than five leaning rectangles.
 *
 * The splay uses the standalone CSS `rotate` property, not `transform`, so
 * GSAP can animate y/scale/opacity on the same element without fighting it.
 */
const SPINES = [
  { label: "p. 380", deg: -26, tone: "bg-primary", height: "clamp(9.5rem, 12vw, 13.5rem)" },
  { label: "p. 142", deg: -13, tone: "bg-primary/85", height: "clamp(10.5rem, 13vw, 14.75rem)" },
  { label: "p. 96", deg: 0, tone: "bg-primary/70", height: "clamp(11rem, 13.5vw, 15.5rem)" },
  { label: "p. 29", deg: 13, tone: "bg-primary/55", height: "clamp(10.5rem, 13vw, 14.75rem)" },
  { label: "p. 1", deg: 26, tone: "bg-primary/40", height: "clamp(9.5rem, 12vw, 13.5rem)" },
];

export function Problem() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        // Spines rise into the fan one after another.
        gsap.from("[data-fan='card']", {
          y: 70,
          opacity: 0,
          scaleY: 0.7,
          transformOrigin: "bottom center",
          duration: 0.85,
          stagger: 0.09,
          ease: "back.out(1.5)",
          scrollTrigger: { trigger: "[data-fan='stage']", start: "top 80%", once: true },
        });

        // Then the whole hand tilts slowly with the scroll.
        gsap.to("[data-fan='stage']", {
          rotation: 7,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      });

      return () => media.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} id="problem" className="bg-background section-y relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/textures/noise.svg')] bg-repeat opacity-[0.035]"
      />

      <div className="shell relative">
        <div className="grid items-center gap-[clamp(2.5rem,4vw,5rem)] lg:grid-cols-[1.05fr_1fr]">
          <Reveal>
            <p className="text-primary text-[0.8125rem] font-semibold tracking-[0.18em] uppercase">
              The problem
            </p>
            <h2 className="text-headline text-foreground mt-4 max-w-[16ch] text-balance">
              Reading one book is easy. Reading{" "}
              <span className="font-serif italic">five</span> is a memory problem.
            </h2>
            <p className="text-lead text-muted-foreground measure mt-6 text-pretty">
              Every book you have open is a separate place to lose. The more you read at
              once, the more of your attention goes on bookkeeping instead of reading.
            </p>
          </Reveal>

          <div
            data-fan="stage"
            aria-hidden
            className="relative mx-auto flex h-[clamp(13rem,18vw,20rem)] w-full max-w-[34rem] items-end justify-center"
          >
            {SPINES.map((spine) => (
              <div
                key={spine.label}
                data-fan="card"
                className="will-animate absolute bottom-0 origin-bottom"
                style={{ rotate: `${spine.deg}deg` }}
              >
                <div
                  className={`flex w-[clamp(2.75rem,3.4vw,4rem)] items-start justify-center rounded-lg ${spine.tone} pt-4 shadow-xl shadow-black/15`}
                  style={{ height: spine.height }}
                >
                  <span className="text-primary-foreground text-[0.6875rem] font-semibold tabular-nums [writing-mode:vertical-rl]">
                    {spine.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Reveal
          stagger={0.12}
          className="mt-[clamp(3rem,5vw,5.5rem)] grid gap-[clamp(1rem,1.5vw,1.75rem)] md:grid-cols-3"
        >
          {PAINS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-card border-border rounded-2xl border p-[clamp(1.25rem,1.6vw,2rem)]"
            >
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-title text-foreground mt-5">{title}</h3>
              <p className="text-muted-foreground mt-2.5 leading-relaxed text-pretty">{body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
