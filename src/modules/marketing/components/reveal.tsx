"use client";

import { useRef } from "react";

import { MOTION_OK, gsap, useGSAP } from "@/modules/marketing/gsap";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered reveal.
 *
 * Two deliberate choices:
 *  - It animates *from* a hidden state rather than *to* one, so if JavaScript
 *    never runs the content is simply visible. Nothing is hidden in CSS.
 *  - Everything sits inside gsap.matchMedia(MOTION_OK), so a visitor who has
 *    asked for reduced motion gets the finished layout with no movement at all
 *    — not a faster animation.
 */
export function Reveal({
  children,
  className,
  y = 28,
  delay = 0,
  stagger,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  /** Seconds between children; omit to animate the wrapper as one block. */
  stagger?: number;
  once?: boolean;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const node = scope.current;
        if (!node) return;
        const targets = stagger ? Array.from(node.children) : node;

        gsap.from(targets, {
          opacity: 0,
          y,
          duration: 0.85,
          ease: "power3.out",
          delay,
          stagger: stagger ?? 0,
          scrollTrigger: { trigger: node, start: "top 88%", once },
        });
      });

      return () => media.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className={cn(className)}>
      {children}
    </div>
  );
}
