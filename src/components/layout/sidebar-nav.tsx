"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/library"
      ? pathname === "/library" || pathname.startsWith("/books")
      : pathname.startsWith(href);
}

/** Full sidebar with labels — desktop (xl and up). */
export function SidebarNav() {
  const isActive = useIsActive();

  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon
              className={cn("size-[1.125rem] shrink-0", active && "text-primary")}
              aria-hidden
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Icon-only rail — tablet (md to xl). A 240px sidebar eats too much of a
 * 768–1024px viewport; the rail keeps navigation one tap away without
 * squeezing the content column.
 */
export function RailNav() {
  const isActive = useIsActive();

  return (
    <nav className="flex flex-col items-center gap-1.5" aria-label="Main">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg transition-colors",
              active
                ? "bg-sidebar-accent text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-[1.125rem]" aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar — mobile only, with iOS home-indicator inset respected. */
export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Main"
      className="bg-background/90 border-border safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t backdrop-blur-md md:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            // min-h-14 keeps every tab above the 44px touch-target floor.
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[0.6875rem] transition-colors",
              active ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
