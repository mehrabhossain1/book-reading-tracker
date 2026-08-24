"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { RiBookOpenFill, RiCloseFill, RiMenu3Fill } from "react-icons/ri";

import { cn } from "@/lib/utils";
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from "@/modules/marketing/gsap";

const LINKS = [
  { href: "#problem", label: "The problem" },
  { href: "#features", label: "Features" },
  { href: "#catalogue", label: "Catalogue" },
  { href: "#how", label: "How it works" },
];

export function LandingNav() {
  const scope = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      // The class swap is cheap and reversible; ScrollTrigger only reports
      // position, it doesn't animate the bar itself.
      const trigger = ScrollTrigger.create({
        start: "top -80",
        onUpdate: (self) => setSolid(self.scroll() > 80),
      });

      media.add(MOTION_OK, () => {
        gsap.from(scope.current, { y: -24, opacity: 0, duration: 0.7, ease: "power3.out" });
      });

      return () => {
        trigger.kill();
        media.revert();
      };
    },
    { scope },
  );

  return (
    <header
      ref={scope}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        solid ? "bg-ink/85 border-ink-line/50 border-b backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="shell flex h-[clamp(4rem,4.5vw,5.5rem)] items-center justify-between gap-6">
        <Link href="/" className="text-cream flex items-center gap-2.5" aria-label="Book Tracker">
          <span className="bg-ember/90 text-ink flex size-9 items-center justify-center rounded-xl">
            <RiBookOpenFill className="size-[1.125rem]" aria-hidden />
          </span>
          <span className="text-[1.0625rem] font-semibold tracking-tight">Book Tracker</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Sections">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-cream-dim hover:text-cream text-[0.9375rem] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/sign-in"
            className="text-cream-dim hover:text-cream rounded-lg px-4 py-2 text-[0.9375rem] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="bg-cream text-ink rounded-full px-5 py-2.5 text-[0.9375rem] font-medium transition-transform hover:scale-[1.03]"
          >
            Start tracking
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="text-cream flex size-10 items-center justify-center rounded-lg lg:hidden"
        >
          {open ? <RiCloseFill className="size-6" /> : <RiMenu3Fill className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="bg-ink/95 border-ink-line/50 border-t backdrop-blur-xl lg:hidden">
          <div className="shell flex flex-col gap-1 py-4">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-cream-dim hover:text-cream py-2.5 text-base"
              >
                {link.label}
              </a>
            ))}
            <Link href="/sign-in" className="text-cream-dim py-2.5 text-base">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="bg-cream text-ink mt-2 rounded-full px-5 py-3 text-center font-medium"
            >
              Start tracking
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
