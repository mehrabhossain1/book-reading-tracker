import Link from "next/link";
import { RiArrowRightUpLine, RiBookOpenFill } from "react-icons/ri";

import { Reveal } from "@/modules/marketing/components/reveal";

export function Cta() {
  return (
    <section className="bg-primary section-y relative overflow-hidden">
      {/* Full-bleed rings — on ultrawide they run past the 1920 canvas. */}
      <div
        aria-hidden
        className="texture-rings-layer opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/textures/noise.svg')] bg-repeat opacity-[0.12] mix-blend-overlay"
      />

      <div className="shell relative">
        <Reveal className="mx-auto flex max-w-[52rem] flex-col items-center text-center">
          <span className="bg-primary-foreground/15 text-primary-foreground flex size-14 items-center justify-center rounded-2xl backdrop-blur">
            <RiBookOpenFill className="size-7" aria-hidden />
          </span>

          <h2 className="text-headline text-primary-foreground mt-7 text-balance">
            Put the bookmarks down.
          </h2>

          <p className="text-lead text-primary-foreground/80 mt-5 text-pretty">
            Add your first book in under a minute. Free, and your data stays in your own
            database.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="bg-primary-foreground text-primary group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[1.0625rem] font-medium transition-transform hover:scale-[1.03]"
            >
              Create your account
              <RiArrowRightUpLine
                className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/sign-in"
              className="border-primary-foreground/35 text-primary-foreground hover:bg-primary-foreground/10 inline-flex items-center rounded-full border px-8 py-4 text-[1.0625rem] transition-colors"
            >
              I already have one
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
