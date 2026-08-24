"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  RiDeleteBin6Fill,
  RiLogoutBoxRFill,
  RiMore2Fill,
  RiShieldUserFill,
  RiSpyFill,
  RiUserForbidFill,
  RiUserFollowFill,
} from "react-icons/ri";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import type { ActionResult } from "@/lib/safe-action";
import { banUser, removeUser, revokeUserSessions, setUserRole, unbanUser } from "@/modules/admin/actions";
import { APP_ROLES, ROLE_LABELS, toRole, type AppRole } from "@/modules/admin/permissions";

export function UserRowActions({
  userId,
  name,
  role,
  banned,
  isSelf,
  viewerIsSuperAdmin,
}: {
  userId: string;
  name: string;
  role: string | null;
  banned: boolean;
  isSelf: boolean;
  viewerIsSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [banOpen, setBanOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("");
  const [permanent, setPermanent] = useState(true);

  const currentRole = toRole(role);

  const run = (
    fn: () => Promise<ActionResult<unknown>>,
    success: string,
    onDone?: () => void,
  ) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(success);
      onDone?.();
      router.refresh();
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            aria-label={`Actions for ${name}`}
          >
            <RiMore2Fill className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {viewerIsSuperAdmin && (
            <>
              <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2 text-xs font-normal">
                <RiShieldUserFill className="size-3.5" />
                Role
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={currentRole}
                onValueChange={(value) =>
                  run(
                    () => setUserRole({ userId, role: value as AppRole }),
                    `${name} is now ${ROLE_LABELS[value as AppRole].toLowerCase()}.`,
                  )
                }
              >
                {APP_ROLES.map((option) => (
                  <DropdownMenuRadioItem
                    key={option}
                    value={option}
                    disabled={isSelf}
                    // Changing your own role is how an admin locks themselves out.
                  >
                    {ROLE_LABELS[option]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            disabled={isSelf}
            onSelect={() =>
              startTransition(async () => {
                const { error } = await authClient.admin.impersonateUser({ userId });
                if (error) {
                  toast.error(error.message ?? "Could not impersonate that account.");
                  return;
                }
                router.push("/library");
                router.refresh();
              })
            }
          >
            <RiSpyFill className="size-4" />
            Impersonate
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() =>
              run(() => revokeUserSessions({ userId }), `Signed ${name} out everywhere.`)
            }
          >
            <RiLogoutBoxRFill className="size-4" />
            Revoke sessions
          </DropdownMenuItem>

          {banned ? (
            <DropdownMenuItem
              onSelect={() => run(() => unbanUser({ userId }), `${name} is unbanned.`)}
            >
              <RiUserFollowFill className="size-4" />
              Unban
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={isSelf} onSelect={() => setBanOpen(true)}>
              <RiUserForbidFill className="size-4" />
              Ban…
            </DropdownMenuItem>
          )}

          {viewerIsSuperAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isSelf}
                onSelect={() => {
                  if (
                    !confirm(
                      `Delete ${name}? This also deletes their books and entire reading history. This cannot be undone.`,
                    )
                  ) {
                    return;
                  }
                  run(() => removeUser({ userId }), `${name} deleted.`);
                }}
              >
                <RiDeleteBin6Fill className="size-4" />
                Delete account
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-left">Ban {name}</DialogTitle>
            <DialogDescription className="text-left">
              Their active sessions are revoked immediately and they can&apos;t sign back in.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="ban-reason">Reason</FieldLabel>
              <Input
                id="ban-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Shown in the audit trail"
              />
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="ban-permanent"
                checked={permanent}
                onCheckedChange={(checked) => setPermanent(checked === true)}
              />
              <FieldLabel htmlFor="ban-permanent" className="font-normal">
                Indefinite
              </FieldLabel>
            </Field>

            {!permanent && (
              <Field>
                <FieldLabel htmlFor="ban-days">Days</FieldLabel>
                <Input
                  id="ban-days"
                  type="number"
                  min={1}
                  max={3650}
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                  className="tabular"
                />
              </Field>
            )}

            <Button
              variant="destructive"
              size="lg"
              disabled={isPending}
              onClick={() =>
                run(
                  () =>
                    banUser({
                      userId,
                      banReason: reason,
                      banForDays: permanent ? undefined : Number(days) || undefined,
                    }),
                  `${name} is banned.`,
                  () => {
                    setBanOpen(false);
                    setReason("");
                    setDays("");
                    setPermanent(true);
                  },
                )
              }
            >
              {isPending ? "Banning…" : "Ban account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
