import Link from "next/link";
import { Plus } from "lucide-react";

import { BottomNav, SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";

/**
 * The real auth gate. `proxy.ts` only avoids a flash of app chrome; this is
 * what actually keeps a signed-out visitor out of the app.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="border-border sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r px-3 py-4 md:flex">
        <Link
          href="/library"
          className="text-muted-foreground hover:text-foreground px-2.5 font-mono text-xs tracking-widest uppercase transition-colors"
        >
          Book Tracker
        </Link>

        <div className="mt-6">
          <SidebarNav />
        </div>

        <Button asChild variant="outline" size="sm" className="mt-4 justify-start">
          <Link href="/books/new">
            <Plus className="size-4" />
            Add a book
          </Link>
        </Button>

        <div className="mt-auto">
          <UserMenu name={user.name} email={user.email} image={user.image} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="border-border flex items-center justify-between border-b px-4 py-2.5 md:hidden">
          <Link href="/library" className="font-mono text-xs tracking-widest uppercase">
            Book Tracker
          </Link>
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/books/new" aria-label="Add a book">
              <Plus className="size-4" />
            </Link>
          </Button>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8 md:py-10">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
