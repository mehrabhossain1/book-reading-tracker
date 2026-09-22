"use client";

import { useEffect } from "react";
import { RotateCcw, WifiOff } from "lucide-react";

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
    <div className="border-border mx-auto mt-10 max-w-md rounded-2xl border border-dashed px-6 py-14 text-center">
      <WifiOff className="text-muted-foreground mx-auto size-8" aria-hidden />
      <p className="mt-4 font-medium">This didn&apos;t load</p>
      <p className="text-muted-foreground mt-2 text-sm">
        Usually a dropped connection. Your reading log is safe — nothing was lost.
      </p>
      <Button onClick={reset} size="lg" className="mt-6 min-h-11 gap-2">
        <RotateCcw className="size-4" aria-hidden />
        Try again
      </Button>
    </div>
  );
}
