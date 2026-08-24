/**
 * Grants a role directly in the database.
 *
 *   pnpm admin:promote you@example.com superadmin
 *
 * This exists because the back office is staff-only: there is no way to create
 * the first super admin from inside the UI. Everything after the first one can
 * be done from /admin.
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { APP_ROLES, isAppRole } from "@/modules/admin/permissions";

async function main() {
  const [email, role = "superadmin"] = process.argv.slice(2);

  if (!email) {
    console.error("Usage: pnpm admin:promote <email> [role]");
    console.error(`Roles: ${APP_ROLES.join(" | ")}`);
    process.exit(1);
  }

  if (!isAppRole(role)) {
    console.error(`Unknown role "${role}". Expected one of: ${APP_ROLES.join(", ")}`);
    process.exit(1);
  }

  const [updated] = await db
    .update(user)
    .set({ role })
    .where(eq(user.email, email))
    .returning({ email: user.email, role: user.role });

  if (!updated) {
    console.error(`No account found for ${email}. Sign up through the app first.`);
    process.exit(1);
  }

  console.log(`${updated.email} is now ${updated.role}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
