import { BarChart3, BookOpen, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
