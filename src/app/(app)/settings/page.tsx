import { headers } from "next/headers";
import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { PasswordForm } from "@/modules/auth/components/password-form";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";

export const metadata: Metadata = { title: "Settings" };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border-border rounded-2xl border p-4 sm:p-5">
      <h2 className="text-sm font-medium">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-0.5 text-sm text-pretty">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const initials = user.name.trim().slice(0, 1).toUpperCase() || "?";

  // Which sign-in methods this account has. An account created through Google
  // has no password yet, and asking it for a "current password" would be a
  // question with no answer — so the form switches to setting the first one.
  const accounts = await auth.api.listUserAccounts({ headers: await headers() });
  const hasPassword = accounts.some((account) => account.providerId === "credential");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />

      <div className="mt-6 space-y-4">
        <Section title="Account">
          <div className="flex items-center gap-3">
            <Avatar className="size-11">
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-muted-foreground truncate text-sm">{user.email}</p>
            </div>
          </div>

          <dl className="border-border mt-4 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Member since</dt>
              <dd className="mt-0.5">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Email verified</dt>
              <dd className="mt-0.5">{user.emailVerified ? "Yes" : "Not yet"}</dd>
            </div>
          </dl>
        </Section>

        <Section
          title="Password"
          description={
            hasPassword
              ? "Change the password you sign in with."
              : "You sign in with Google. Add a password to sign in with your email as well."
          }
        >
          <PasswordForm hasPassword={hasPassword} />
        </Section>

        <Section title="Appearance" description="Follows your system setting by default.">
          <ThemeToggle />
        </Section>

        <Section title="Session">
          <SignOutButton />
        </Section>
      </div>
    </div>
  );
}
