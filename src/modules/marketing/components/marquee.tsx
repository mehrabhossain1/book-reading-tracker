"use client";

import { useRef } from "react";
import { RiBook2Fill } from "react-icons/ri";

import { MOTION_OK, gsap, useGSAP } from "@/modules/marketing/gsap";

const TITLES = [
  "The Power Broker",
  "Thinking, Fast and Slow",
  "Pride and Prejudice",
  "The Pragmatic Programmer",
  "Middlemarch",
  "The Art of Thinking Clearly",
  "Gödel, Escher, Bach",
  "The Brothers Karamazov",
];

/**
 * Infinite horizontal drift. The track is duplicated once and moved exactly
 * -50%, so the seam lands on an identical frame and the loop is invisible.
 */
export function Marquee() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        gsap.to("[data-marquee='track']", {
          xPercent: -50,
          duration: 42,
          ease: "none",
          repeat: -1,
        });
      });
      return () => media.revert();
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="bg-ink border-ink-line/40 relative overflow-hidden border-y py-[clamp(1rem,1.4vw,1.6rem)]"
      aria-hidden
    >
      {/* Edges fade so the loop dissolves rather than clipping. */}
      <div className="from-ink pointer-events-none absolute inset-y-0 left-0 z-10 w-[12%] bg-gradient-to-r to-transparent" />
      <div className="from-ink pointer-events-none absolute inset-y-0 right-0 z-10 w-[12%] bg-gradient-to-l to-transparent" />

      <div data-marquee="track" className="flex w-max items-center gap-[clamp(2rem,3vw,4rem)]">
        {[...TITLES, ...TITLES].map((title, index) => (
          <span
            key={`${title}-${index}`}
            className="text-cream-dim/70 flex shrink-0 items-center gap-3 text-[clamp(0.9375rem,1.05vw,1.25rem)] whitespace-nowrap"
          >
            <RiBook2Fill className="text-ember/70 size-4 shrink-0" />
            {title}
          </span>
        ))}
      </div>
    </div>
  );
}
