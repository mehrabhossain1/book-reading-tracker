"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/library"
      ? pathname === "/library" || pathname.startsWith("/books")
      : pathname.startsWith(href);
}

export function SidebarNav() {
  const isActive = useIsActive();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
            isActive(href)
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          )}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav className="bg-background/95 border-border fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t backdrop-blur md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] transition-colors",
            isActive(href) ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
