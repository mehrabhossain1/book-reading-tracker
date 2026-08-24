import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/library");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-16 sm:px-6">
      <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl">
        <BookOpen className="size-5" aria-hidden />
      </span>

      <h1 className="mt-7 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Read five books at once without losing your place in any of them.
      </h1>

      <p className="text-muted-foreground mt-4 text-base leading-relaxed text-pretty sm:text-lg">
        Log the page you stopped on. When you pick the book back up — a week or a month
        later — the page to resume from is already filled in.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild size="lg" className="gap-1.5">
          <Link href="/sign-up">
            Create an account
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>

      <dl className="text-muted-foreground border-border mt-12 grid grid-cols-1 gap-5 border-t pt-8 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-foreground font-medium">One bookmark per book</dt>
          <dd className="mt-1 text-pretty">Every book keeps its own page, independently.</dd>
        </div>
        <div>
          <dt className="text-foreground font-medium">Resume without thinking</dt>
          <dd className="mt-1 text-pretty">The next page is pre-filled, so you never guess.</dd>
        </div>
        <div>
          <dt className="text-foreground font-medium">An honest history</dt>
          <dd className="mt-1 text-pretty">Every sitting is logged, never overwritten.</dd>
        </div>
      </dl>
    </main>
  );
}
