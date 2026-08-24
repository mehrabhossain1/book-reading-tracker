import type { Metadata } from "next";

import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <dl className="mt-8 space-y-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{user.name}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate">{user.email}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Member since</dt>
          <dd>{formatDate(user.createdAt)}</dd>
        </div>
      </dl>

      <Separator className="my-8" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Appearance</p>
          <p className="text-muted-foreground text-sm">Follows your system by default.</p>
        </div>
        <ThemeToggle />
      </div>

      <Separator className="my-8" />

      <SignOutButton />
    </div>
  );
}
