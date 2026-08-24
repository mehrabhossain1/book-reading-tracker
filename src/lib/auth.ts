import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";
import { ADMIN_ROLES, ac, roles } from "@/modules/admin/permissions";

const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

/**
 * Better Auth rejects any request whose Origin header isn't trusted, and the
 * only default trusted origin is `baseURL`. On Vercel that means a deployment
 * whose BETTER_AUTH_URL still points at localhost fails every sign-in with
 * "Invalid origin".
 *
 * Vercel injects these two automatically, so production and every preview
 * deployment are trusted without hand-maintaining a list.
 */
function trustedOrigins(): string[] {
  const origins = new Set<string>([env.BETTER_AUTH_URL]);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) origins.add(`https://${production}`);

  const deployment = process.env.VERCEL_URL;
  if (deployment) origins.add(`https://${deployment}`);

  return [...origins];
}

export const auth = betterAuth({
  appName: "Book Tracker",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: trustedOrigins(),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // v1 has no mail transport; turn this on once one is wired up.
    requireEmailVerification: false,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh the row at most once a day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [
    adminPlugin({
      ac,
      roles,
      adminRoles: [...ADMIN_ROLES],
      defaultRole: "user",
      // Impersonation sessions are short on purpose — it is a debugging tool,
      // not a way to work as someone else all afternoon.
      impersonationSessionDuration: 60 * 30,
      defaultBanReason: "Violated the terms of use",
      bannedUserMessage: "This account has been suspended. Contact support if you think that's wrong.",
    }),
    // Must stay last: lets server actions write the session cookie.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = Session["user"];
