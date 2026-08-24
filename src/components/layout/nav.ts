import { BarChart3, BookOpen, Settings, ShieldCheck } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/** Only rendered for staff — see requireStaff() for the actual gate. */
export const ADMIN_NAV_ITEM = {
  href: "/admin",
  label: "Admin",
  icon: ShieldCheck,
} as const;

export type NavItem = {
  href: string;
  label: string;
  icon: typeof BookOpen;
};

export function navItemsFor(isStaff: boolean): NavItem[] {
  return isStaff ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : [...NAV_ITEMS];
}
