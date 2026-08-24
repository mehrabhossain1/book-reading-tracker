import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-[24rem]">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 rounded-lg"
          aria-label="Book Tracker"
        >
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
            <BookOpen className="size-[1.125rem]" aria-hidden />
          </span>
          <span className="text-base font-semibold tracking-tight">Book Tracker</span>
        </Link>

        <div className="bg-card border-border rounded-2xl border p-6 shadow-sm sm:p-7">
          {children}
        </div>
      </div>
    </main>
  );
}
