import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[22rem]">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-10 block text-center font-mono text-xs tracking-widest uppercase transition-colors"
        >
          Book Tracker
        </Link>
        {children}
      </div>
    </main>
  );
}
