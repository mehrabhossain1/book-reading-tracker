import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/session";
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

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/library");

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
