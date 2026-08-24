"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function UserMenu({
  name,
  email,
  image,
  compact = false,
}: {
  name: string;
  email: string;
  image?: string | null;
  /** Avatar-only trigger, for the tablet rail and the mobile top bar. */
  compact?: boolean;
}) {
  const router = useRouter();
  const initials = name.trim().slice(0, 1).toUpperCase() || "?";

  const avatar = (
    <Avatar className="size-7">
      {image ? <AvatarImage src={image} alt="" /> : null}
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" className="size-9" aria-label="Account">
            {avatar}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="hover:bg-sidebar-accent h-auto w-full justify-start gap-2.5 px-2 py-2"
          >
            {avatar}
            <span className="min-w-0 flex-1 truncate text-left text-sm font-normal">
              {name}
            </span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="text-muted-foreground block truncate text-xs">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await authClient.signOut();
            router.push("/sign-in");
            router.refresh();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
