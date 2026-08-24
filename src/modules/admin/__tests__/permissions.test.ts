import { describe, expect, it } from "vitest";

import {
  ADMIN_ROLES,
  APP_ROLES,
  ROLE_LABELS,
  isAppRole,
  isStaff,
  isSuperAdmin,
  roles,
  statement,
  toRole,
} from "../permissions";

describe("toRole", () => {
  it("treats a missing role as a plain member", () => {
    // Accounts created before the admin plugin have a NULL role column.
    expect(toRole(null)).toBe("user");
    expect(toRole(undefined)).toBe("user");
  });

  it("rejects anything not in the enum rather than trusting the column", () => {
    expect(toRole("root")).toBe("user");
    expect(toRole("ADMIN")).toBe("user");
    expect(toRole("")).toBe("user");
  });

  it("passes real roles through", () => {
    expect(toRole("admin")).toBe("admin");
    expect(toRole("superadmin")).toBe("superadmin");
  });
});

describe("isStaff / isSuperAdmin", () => {
  it("counts both admin tiers as staff", () => {
    expect(isStaff("admin")).toBe(true);
    expect(isStaff("superadmin")).toBe(true);
  });

  it("keeps members and unknown values out", () => {
    expect(isStaff("user")).toBe(false);
    expect(isStaff(null)).toBe(false);
    expect(isStaff("root")).toBe(false);
  });

  it("reserves super admin for exactly one role", () => {
    expect(isSuperAdmin("superadmin")).toBe(true);
    expect(isSuperAdmin("admin")).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });
});

/**
 * These are the assertions that give the two admin tiers meaning. If they ever
 * pass trivially, "super admin" has become decorative.
 */
describe("role boundaries", () => {
  const perms = (role: keyof typeof roles) =>
    roles[role].statements as Record<string, readonly string[]>;

  it("lets only a super admin impersonate other admins", () => {
    expect(perms("superadmin").user).toContain("impersonate-admins");
    expect(perms("admin").user).not.toContain("impersonate-admins");
  });

  it("lets only a super admin manage staff", () => {
    expect(perms("superadmin").platform).toContain("manage-admins");
    expect(perms("admin").platform).not.toContain("manage-admins");
  });

  it("still lets a plain admin do support work", () => {
    expect(perms("admin").user).toContain("ban");
    expect(perms("admin").user).toContain("impersonate");
    expect(perms("admin").session).toContain("revoke");
    expect(perms("admin").platform).toContain("metrics");
  });

  it("gives a member no administrative permissions at all", () => {
    expect(perms("user").user).toEqual([]);
    expect(perms("user").session).toEqual([]);
    expect(perms("user").platform).toEqual([]);
  });
});

describe("role wiring", () => {
  it("defines every role named in APP_ROLES", () => {
    expect(Object.keys(roles).sort()).toEqual([...APP_ROLES].sort());
  });

  it("labels every role", () => {
    for (const role of APP_ROLES) {
      expect(ROLE_LABELS[role]?.length).toBeGreaterThan(0);
    }
  });

  it("only hands Better Auth roles that actually exist", () => {
    // better-auth 1.7 throws at startup if adminRoles names an undefined role.
    for (const role of ADMIN_ROLES) {
      expect(Object.keys(roles)).toContain(role);
    }
  });

  it("extends the built-in statements rather than replacing them", () => {
    expect(statement.user).toContain("ban");
    expect(statement.session).toContain("revoke");
    expect(statement.platform).toContain("metrics");
  });
});

describe("isAppRole", () => {
  it("guards untrusted input", () => {
    expect(isAppRole("admin")).toBe(true);
    expect(isAppRole("nope")).toBe(false);
    expect(isAppRole(7)).toBe(false);
    expect(isAppRole(undefined)).toBe(false);
  });
});
