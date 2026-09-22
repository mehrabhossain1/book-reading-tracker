"use client";

import { useEffect } from "react";
import { RotateCcw, WifiOff } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

/**
 * A failed load (a dropped connection on a train, a database blip) lands here
 * instead of blanking the app. `reset` retries the segment in place.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={WifiOff}
      title="This didn't load"
      className="mx-auto mt-10 max-w-md"
      action={
        <Button onClick={reset} size="lg" className="gap-2">
          <RotateCcw className="size-4" aria-hidden />
          Try again
        </Button>
      }
    >
      Usually a dropped connection. Your reading log is safe — nothing was lost.
    </EmptyState>
  );
}
