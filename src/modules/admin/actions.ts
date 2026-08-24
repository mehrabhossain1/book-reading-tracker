"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ActionError, authedAction } from "@/lib/safe-action";
import { isStaff, isSuperAdmin } from "@/modules/admin/permissions";
import { banUserSchema, setUserRoleSchema, userIdSchema } from "@/modules/admin/schema";

/**
 * Every mutation here goes through Better Auth's own admin API rather than
 * writing SQL directly. That is deliberate: the API enforces the access-control
 * rules defined in permissions.ts and runs the side effects that matter — most
 * importantly, banning a user revokes their live sessions instead of leaving
 * them signed in until the cookie expires.
 *
 * `authedAction` still resolves the caller's session first, so these can never
 * be invoked by an anonymous request.
 */

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

async function assertStaff(role: string | null | undefined) {
  if (!isStaff(role)) throw new ActionError("You don't have access to that.");
}

/**
 * Staff may not act on other staff — only a super admin may.
 *
 * Better Auth gates *impersonating* an admin behind its own permission, but it
 * has no equivalent for banning or revoking sessions. Without this check a
 * plain admin can ban the super admin and lock the owner out of their own
 * platform. Found by testing the action directly rather than through the UI,
 * which hides these controls but does not enforce anything.
 */
async function assertCanActOn(targetUserId: string, actorRole: string | null | undefined) {
  if (isSuperAdmin(actorRole)) return;

  const [target] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, targetUserId))
    .limit(1);

  if (!target) throw new ActionError("That account no longer exists.");
  if (isStaff(target.role)) {
    throw new ActionError("Only a super admin can act on another admin.");
  }
}

export const setUserRole = authedAction(setUserRoleSchema, async (input, { user }) => {
  // Promoting or demoting staff is the super admin's job alone — otherwise any
  // admin could promote themselves and the tier would be decorative.
  if (!isSuperAdmin(user.role)) {
    throw new ActionError("Only a super admin can change roles.");
  }
  if (input.userId === user.id) {
    throw new ActionError("You can't change your own role.");
  }

  await auth.api.setRole({
    body: { userId: input.userId, role: input.role },
    headers: await headers(),
  });

  revalidateAdmin();
  return { userId: input.userId, role: input.role };
});

export const banUser = authedAction(banUserSchema, async (input, { user }) => {
  await assertStaff(user.role);
  if (input.userId === user.id) throw new ActionError("You can't ban yourself.");
  await assertCanActOn(input.userId, user.role);

  await auth.api.banUser({
    body: {
      userId: input.userId,
      banReason: input.banReason,
      ...(input.banForDays
        ? { banExpiresIn: input.banForDays * 24 * 60 * 60 }
        : {}),
    },
    headers: await headers(),
  });

  revalidateAdmin();
  return { userId: input.userId };
});

export const unbanUser = authedAction(userIdSchema, async (input, { user }) => {
  await assertStaff(user.role);
  await assertCanActOn(input.userId, user.role);

  await auth.api.unbanUser({
    body: { userId: input.userId },
    headers: await headers(),
  });

  revalidateAdmin();
  return { userId: input.userId };
});

export const revokeUserSessions = authedAction(userIdSchema, async (input, { user }) => {
  await assertStaff(user.role);
  await assertCanActOn(input.userId, user.role);

  await auth.api.revokeUserSessions({
    body: { userId: input.userId },
    headers: await headers(),
  });

  revalidateAdmin();
  return { userId: input.userId };
});

export const removeUser = authedAction(userIdSchema, async (input, { user }) => {
  // Deleting an account destroys its books and reading history via cascade.
  // Restricting it to super admins keeps that behind the highest tier.
  if (!isSuperAdmin(user.role)) {
    throw new ActionError("Only a super admin can delete an account.");
  }
  if (input.userId === user.id) throw new ActionError("You can't delete your own account here.");

  await auth.api.removeUser({
    body: { userId: input.userId },
    headers: await headers(),
  });

  revalidateAdmin();
  return { userId: input.userId };
});
