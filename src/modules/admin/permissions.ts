import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Access control for the platform back office.
 *
 * Better Auth ships `user` and `session` statements; we add a `platform`
 * resource for things that aren't about a single user.
 */
export const statement = {
  ...defaultStatements,
  platform: ["metrics", "manage-admins"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Three roles, and the line between the two admin tiers is deliberate:
 *
 *   admin       — day-to-day support. Can see everything, ban, impersonate a
 *                 normal user, revoke sessions.
 *   superadmin  — everything admin can do, PLUS `impersonate-admins` (Better
 *                 Auth deliberately withholds this from its built-in admin
 *                 role) and `platform:manage-admins`, which is what gates
 *                 promoting or demoting another admin.
 *
 * Without that split, any admin could promote themselves to the top or
 * impersonate a colleague, and "super" admin would mean nothing.
 */
export const roles = {
  user: ac.newRole({ user: [], session: [], platform: [] }),

  admin: ac.newRole({
    ...adminAc.statements,
    platform: ["metrics"],
  }),

  superadmin: ac.newRole({
    user: [...statement.user],
    session: [...statement.session],
    platform: ["metrics", "manage-admins"],
  }),
} as const;

export const APP_ROLES = ["user", "admin", "superadmin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** Roles Better Auth should treat as staff for its own permission checks. */
export const ADMIN_ROLES = ["admin", "superadmin"] as const satisfies readonly AppRole[];

export const ROLE_LABELS: Record<AppRole, string> = {
  user: "Member",
  admin: "Admin",
  superadmin: "Super admin",
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

/** Normalises the nullable `user.role` column into a role we understand. */
export function toRole(value: string | null | undefined): AppRole {
  return isAppRole(value) ? value : "user";
}

export const isStaff = (role: string | null | undefined) =>
  (ADMIN_ROLES as readonly string[]).includes(toRole(role));

export const isSuperAdmin = (role: string | null | undefined) => toRole(role) === "superadmin";
