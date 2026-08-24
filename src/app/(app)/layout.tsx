import Link from "next/link";
import { Plus } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { BottomNav, RailNav, SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";

/**
 * Three-tier shell:
 *   < md    bottom tab bar + compact top bar
 *   md–xl   icon rail (a 240px sidebar is too much of a tablet viewport)
 *   xl +    full sidebar with labels
 *
 * The real auth gate lives here too — `proxy.ts` only avoids a flash of chrome.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-1">
      {/* Tablet: icon rail */}
      <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-dvh w-16 shrink-0 flex-col items-center border-r py-4 md:flex xl:hidden">
        <Brand showWordmark={false} />
        <div className="mt-6">
          <RailNav />
        </div>
        <Button
          asChild
          size="icon"
          className="mt-4 size-10 rounded-lg"
          aria-label="Add a book"
        >
          <Link href="/books/new">
            <Plus className="size-4" />
          </Link>
        </Button>
        <div className="mt-auto">
          <UserMenu name={user.name} email={user.email} image={user.image} compact />
        </div>
      </aside>

      {/* Desktop: full sidebar */}
      <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r px-3 py-4 xl:flex">
        <Brand className="px-2" />
        <div className="mt-6">
          <SidebarNav />
        </div>
        <Button asChild className="mt-4 justify-start gap-2" size="lg">
          <Link href="/books/new">
            <Plus className="size-4" />
            Add a book
          </Link>
        </Button>
        <div className="mt-auto">
          <UserMenu name={user.name} email={user.email} image={user.image} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile: top bar */}
        <header className="bg-background/90 border-border sticky top-0 z-30 flex items-center justify-between border-b px-4 py-2.5 backdrop-blur-md md:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <Button asChild size="icon-sm" variant="ghost">
              <Link href="/books/new" aria-label="Add a book">
                <Plus className="size-[1.125rem]" />
              </Link>
            </Button>
            <UserMenu name={user.name} email={user.email} image={user.image} compact />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-10 lg:px-8 lg:pt-10">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
