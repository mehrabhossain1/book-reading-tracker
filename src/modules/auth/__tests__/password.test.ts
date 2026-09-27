import { describe, expect, it } from "vitest";

import { generatePassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { changePasswordSchema, setPasswordSchema } from "../schema";

const valid = {
  currentPassword: "old-password-1",
  newPassword: "new-password-1",
  confirmPassword: "new-password-1",
  signOutOtherSessions: true,
};

describe("changePasswordSchema", () => {
  it("accepts a well-formed change", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("catches a mistyped confirmation, and says which field is wrong", () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: "new-password-2" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("refuses a 'new' password identical to the current one", () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      newPassword: valid.currentPassword,
      confirmPassword: valid.currentPassword,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["newPassword"]);
  });

  it("enforces the same length rule the server does", () => {
    const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: short, confirmPassword: short })
        .success,
    ).toBe(false);

    const long = "a".repeat(MAX_PASSWORD_LENGTH + 1);
    expect(
      changePasswordSchema.safeParse({ ...valid, newPassword: long, confirmPassword: long }).success,
    ).toBe(false);
  });

  it("requires the current password — a stale open tab is not enough", () => {
    expect(changePasswordSchema.safeParse({ ...valid, currentPassword: "" }).success).toBe(false);
  });
});

describe("setPasswordSchema", () => {
  it("takes a new password and its confirmation, and nothing else", () => {
    expect(
      setPasswordSchema.safeParse({
        newPassword: "first-password",
        confirmPassword: "first-password",
      }).success,
    ).toBe(true);
  });

  it("still checks the two match", () => {
    expect(
      setPasswordSchema.safeParse({ newPassword: "abcdefgh", confirmPassword: "abcdefgi" }).success,
    ).toBe(false);
  });
});

describe("generatePassword", () => {
  it("is long enough to satisfy the rule it feeds", () => {
    expect(generatePassword().length).toBeGreaterThanOrEqual(MIN_PASSWORD_LENGTH);
    expect(generatePassword(32)).toHaveLength(32);
  });

  it("leaves out the characters people misread when reading one out", () => {
    const generated = Array.from({ length: 200 }, () => generatePassword()).join("");
    expect(generated).not.toMatch(/[0O1lI]/);
    expect(generated).toMatch(/^[a-zA-Z2-9]+$/);
  });

  it("does not repeat itself", () => {
    const seen = new Set(Array.from({ length: 200 }, () => generatePassword()));
    expect(seen.size).toBe(200);
  });
});
