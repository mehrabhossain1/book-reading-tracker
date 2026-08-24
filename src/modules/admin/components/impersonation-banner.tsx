"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RiSpyFill } from "react-icons/ri";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/**
 * Impersonation is invisible by design — the app looks exactly as it does to
 * the person being impersonated. That is precisely why it needs a loud,
 * permanent banner: without it, it is far too easy to forget and act as
 * someone else.
 */
export function ImpersonationBanner({ name }: { name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="bg-destructive text-destructive-foreground sticky top-0 z-50 flex items-center justify-center gap-3 px-4 py-2 text-sm">
      <RiSpyFill className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">
        You are viewing the app as <strong className="font-semibold">{name}</strong>
      </span>
      <Button
        size="xs"
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await authClient.admin.stopImpersonating();
            router.push("/admin");
            router.refresh();
          })
        }
      >
        {isPending ? "Stopping…" : "Stop"}
      </Button>
    </div>
  );
}
