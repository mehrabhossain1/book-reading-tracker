"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // The stored theme isn't knowable during SSR. This is the hydration-safe way
  // to ask "am I on the client yet?" without a setState-in-effect cascade.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <Select value={mounted ? (theme ?? "system") : "system"} onValueChange={setTheme}>
      <SelectTrigger className="w-32" aria-label="Theme">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="system">System</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  );
}
