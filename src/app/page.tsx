import type { Metadata } from "next";

import { Catalogue } from "@/modules/marketing/components/catalogue";
import { Cta } from "@/modules/marketing/components/cta";
import { Features } from "@/modules/marketing/components/features";
import { Hero } from "@/modules/marketing/components/hero";
import { HowItWorks } from "@/modules/marketing/components/how-it-works";
import { LandingNav } from "@/modules/marketing/components/landing-nav";
import { Marquee } from "@/modules/marketing/components/marquee";
import { Problem } from "@/modules/marketing/components/problem";
import { Showcase } from "@/modules/marketing/components/showcase";
import { SiteFooter } from "@/modules/marketing/components/site-footer";

export const metadata: Metadata = {
  title: "Book Tracker — read several books at once without losing your place",
  description:
    "Log the page you stopped on. Pick a book up a month later and the page to resume from is already filled in — for every book, independently.",
};

/**
 * Static: prerendered at build and served from the CDN edge. It used to read
 * the session to redirect signed-in readers, which made every visit to the
 * heaviest page in the app a server render. That redirect now lives in
 * proxy.ts, which runs before the static file is served.
 */
export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Marquee />
        <Problem />
        <Features />
        <Catalogue />
        <Showcase />
        <HowItWorks />
        <Cta />
      </main>
      <SiteFooter />
    </>
  );
}
