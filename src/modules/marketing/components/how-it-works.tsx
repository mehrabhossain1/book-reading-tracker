"use client";

import { useRef } from "react";
import { RiAddCircleFill, RiCheckboxCircleFill, RiEditCircleFill } from "react-icons/ri";

import { Reveal } from "@/modules/marketing/components/reveal";
import { MOTION_OK, gsap, useGSAP } from "@/modules/marketing/gsap";

const STEPS = [
  {
    icon: RiAddCircleFill,
    title: "Add the book",
    body: "Title and page count. That is the whole form — everything else is optional.",
  },
  {
    icon: RiEditCircleFill,
    title: "Log where you stopped",
    body: "One number: the page you finished on. The starting page is already filled in for you.",
  },
  {
    icon: RiCheckboxCircleFill,
    title: "Come back whenever",
    body: "A week or three months later, the library tells you the exact page to open to.",
  },
];

export function HowItWorks() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        // The connecting rule draws itself as the section arrives.
        gsap.from("[data-steps='rule']", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.3,
          ease: "power2.inOut",
          scrollTrigger: { trigger: scope.current, start: "top 68%", once: true },
        });

        gsap.from("[data-steps='node']", {
          scale: 0,
          opacity: 0,
          duration: 0.6,
          stagger: 0.22,
          ease: "back.out(2)",
          scrollTrigger: { trigger: scope.current, start: "top 68%", once: true },
        });
      });
      return () => media.revert();
    },
    { scope },
  );

  return (
    <section ref={scope} id="how" className="bg-background section-y relative">
      <div className="shell">
        <Reveal className="measure-wide">
          <p className="text-primary text-[0.8125rem] font-semibold tracking-[0.18em] uppercase">
            How it works
          </p>
          <h2 className="text-headline text-foreground mt-4 text-balance">
            Three steps. Then <span className="font-serif italic">never</span> think about it again.
          </h2>
        </Reveal>

        <div className="relative mt-[clamp(3rem,5vw,5.5rem)]">
          <div
            data-steps="rule"
            aria-hidden
            className="via-primary/40 absolute top-6 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent to-transparent md:block"
          />

          <ol className="grid gap-[clamp(2rem,3vw,3rem)] md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="relative">
                <span
                  data-steps="node"
                  className="bg-primary text-primary-foreground ring-background relative z-10 flex size-12 items-center justify-center rounded-full ring-8"
                >
                  <Icon className="size-6" aria-hidden />
                </span>
                <p className="text-muted-foreground mt-5 font-mono text-[0.8125rem]">
                  Step {index + 1}
                </p>
                <h3 className="text-title text-foreground mt-1.5">{title}</h3>
                <p className="text-muted-foreground mt-2.5 leading-relaxed text-pretty">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
