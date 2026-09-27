"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A password field with a reveal toggle, used by every password form in the
 * app — your own on /settings, and the one an admin sets for someone else.
 *
 * The toggle is `tabIndex={-1}` on purpose: tabbing from the field should reach
 * the next field or the submit button, not a decoration. It is still reachable
 * by pointer and by screen reader.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-9", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        tabIndex={-1}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="text-muted-foreground absolute top-1/2 right-0.5 -translate-y-1/2"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
