import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/library");

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
        Book Tracker
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
        Read five books at once without losing your place in any of them.
      </h1>
      <p className="text-muted-foreground mt-4 leading-relaxed">
        Log the page you stopped on. When you pick the book back up — a week or a month
        later — the page to resume from is already filled in.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button asChild size="lg">
          <Link href="/sign-up">Create an account</Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
