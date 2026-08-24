import Link from "next/link";
import { RiBookOpenFill, RiGithubFill } from "react-icons/ri";

export function SiteFooter() {
  return (
    <footer className="bg-ink border-ink-line/40 border-t">
      <div className="shell flex flex-col gap-6 py-[clamp(2.5rem,3.5vw,4rem)] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="bg-ember/90 text-ink flex size-8 items-center justify-center rounded-lg">
            <RiBookOpenFill className="size-4" aria-hidden />
          </span>
          <span className="text-cream text-[0.9375rem] font-semibold tracking-tight">
            Book Tracker
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-7 gap-y-2" aria-label="Footer">
          <a href="#problem" className="text-cream-dim hover:text-cream text-sm transition-colors">
            The problem
          </a>
          <a href="#features" className="text-cream-dim hover:text-cream text-sm transition-colors">
            Features
          </a>
          <a href="#how" className="text-cream-dim hover:text-cream text-sm transition-colors">
            How it works
          </a>
          <Link href="/sign-in" className="text-cream-dim hover:text-cream text-sm transition-colors">
            Sign in
          </Link>
          <a
            href="https://github.com/mehrabhossain1/book-reading-tracker"
            target="_blank"
            rel="noreferrer"
            className="text-cream-dim hover:text-cream inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <RiGithubFill className="size-4" aria-hidden />
            Source
          </a>
        </nav>

        <p className="text-cream-dim/60 text-sm">
          © {new Date().getFullYear()} Book Tracker
        </p>
      </div>
    </footer>
  );
}
