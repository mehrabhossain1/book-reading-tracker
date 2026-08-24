"use client";

import Link from "next/link";
import { useRef } from "react";
import { RiArrowDownLine, RiArrowRightUpLine, RiSparkling2Fill } from "react-icons/ri";

import { BookChip } from "@/modules/marketing/components/book-chip";
import { MOTION_OK, gsap, useGSAP } from "@/modules/marketing/gsap";

const FLOATING = [
  {
    key: "power-broker",
    props: { title: "The Power Broker", author: "Robert A. Caro", page: 380, total: 1246 },
    className: "left-[2%] top-[18%] rotate-[-8deg] 2xl:left-[6%]",
    depth: 0.55,
    spin: -5,
  },
  {
    key: "thinking",
    props: { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", page: 142, total: 499 },
    className: "right-[2%] top-[12%] rotate-[7deg] 2xl:right-[6%]",
    depth: 0.85,
    spin: 6,
  },
  {
    key: "pride",
    props: { title: "Pride and Prejudice", author: "Jane Austen", page: 279, total: 279, finished: true },
    className: "left-[6%] bottom-[6%] rotate-[5deg] 2xl:left-[11%]",
    depth: 1.15,
    spin: 4,
  },
  {
    key: "pragmatic",
    props: { title: "The Pragmatic Programmer", author: "Hunt & Thomas", page: 96, total: 352 },
    className: "right-[5%] bottom-[10%] rotate-[-6deg] 2xl:right-[10%]",
    depth: 0.7,
    spin: -7,
  },
];

export function Hero() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

        intro
          .from("[data-hero='eyebrow']", { y: 18, opacity: 0, duration: 0.6 })
          .from("[data-hero='line']", { yPercent: 115, opacity: 0, duration: 1, stagger: 0.09 }, "-=0.3")
          .from("[data-hero='lead']", { y: 20, opacity: 0, duration: 0.7 }, "-=0.55")
          .from("[data-hero='actions'] > *", { y: 18, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.45")
          .from("[data-hero='cue']", { opacity: 0, duration: 0.6 }, "-=0.2");

        // Cards fly in last, each from its own angle.
        intro.from(
          "[data-hero='chip']",
          { opacity: 0, scale: 0.86, rotate: 0, y: 40, duration: 0.9, stagger: 0.1 },
          "-=0.9",
        );

        // Parallax + slow counter-rotation as the hero scrolls away. Each card
        // moves at its own rate, which is what sells the depth.
        gsap.utils.toArray<HTMLElement>("[data-hero='chip']").forEach((chip) => {
          const depth = Number(chip.dataset.depth ?? 1);
          const spin = Number(chip.dataset.spin ?? 0);

          gsap.to(chip, {
            yPercent: -34 * depth,
            rotate: `+=${spin}`,
            ease: "none",
            scrollTrigger: {
              trigger: scope.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        });

        // The whole word-mark block drifts up a touch slower than the page.
        gsap.to("[data-hero='copy']", {
          yPercent: -12,
          opacity: 0.35,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.4,
          },
        });
      });

      return () => media.revert();
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className="bg-ink relative isolate overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Full-bleed background stack — these run edge to edge on ultrawide
          while the shell below keeps content on the 1920 canvas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/textures/grid.svg')] bg-repeat opacity-[0.13]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/textures/noise.svg')] bg-repeat opacity-[0.11] mix-blend-overlay"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 8%, oklch(0.5 0.13 55 / 0.42), transparent 68%)",
        }}
      />
      <div
        aria-hidden
        className="from-ink pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t to-transparent"
      />

      <div className="shell relative flex min-h-[clamp(44rem,92vh,60rem)] flex-col items-center justify-center pt-[clamp(7rem,10vw,10rem)] pb-[clamp(4rem,7vw,7rem)]">
        {/* Decorative furniture: real-looking, but not real data. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
          {FLOATING.map((card) => (
            <div
              key={card.key}
              data-hero="chip"
              data-depth={card.depth}
              data-spin={card.spin}
              className={`will-animate absolute ${card.className}`}
            >
              <BookChip {...card.props} />
            </div>
          ))}
        </div>

        <div data-hero="copy" className="relative flex flex-col items-center text-center">
          <span
            data-hero="eyebrow"
            className="border-ink-line/70 bg-ink-soft/60 text-cream-dim inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.8125rem] backdrop-blur"
          >
            <RiSparkling2Fill className="text-ember size-3.5" aria-hidden />
            For people who read several books at once
          </span>

          <h1
            id="hero-heading"
            className="text-display text-cream mt-[clamp(1.5rem,2.5vw,2.5rem)] max-w-[18ch] text-balance"
          >
            {/* Each line is clipped so the words can slide up out of nothing. */}
            <span className="block overflow-hidden pb-[0.12em]">
              <span data-hero="line" className="block">
                Five books in.
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.12em]">
              <span data-hero="line" className="block">
                <span className="text-ember font-serif italic">Zero</span> lost pages.
              </span>
            </span>
          </h1>

          <p
            data-hero="lead"
            className="text-lead text-cream-dim measure-wide mt-[clamp(1.25rem,2vw,2rem)] text-pretty"
          >
            Log the page you stopped on. Pick the book up a month later and the page to
            resume from is already filled in — for every book, independently.
          </p>

          <div
            data-hero="actions"
            className="mt-[clamp(1.75rem,2.5vw,2.75rem)] flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/sign-up"
              className="bg-cream text-ink group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[1.0625rem] font-medium transition-transform hover:scale-[1.03]"
            >
              Start tracking free
              <RiArrowRightUpLine
                className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
            <a
              href="#problem"
              className="border-ink-line text-cream hover:bg-ink-soft inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-[1.0625rem] transition-colors"
            >
              See the problem it solves
            </a>
          </div>
        </div>

        <div
          data-hero="cue"
          aria-hidden
          className="text-cream-dim/60 absolute bottom-[clamp(1.5rem,3vw,3rem)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <span className="text-[0.6875rem] tracking-[0.2em] uppercase">Scroll</span>
          <RiArrowDownLine className="size-4 animate-bounce" aria-hidden />
        </div>
      </div>
    </section>
  );
}
