/**
 * Sets an account's password from the command line.
 *
 *   pnpm admin:set-password you@example.com              # asks twice, hidden
 *   pnpm admin:set-password you@example.com --generate   # prints a strong one
 *   pnpm admin:set-password you@example.com --keep-sessions
 *
 * This exists for the same reason as promote.ts: the in-app reset needs a
 * signed-in session, and the one person who can be locked out of a one-person
 * platform is the super admin. Everything else — a reader who forgot their
 * password, the super admin changing their own — is done from the app.
 *
 * Hashing and account shape come from Better Auth's own context, never from a
 * hand-rolled hash: a password written any other way would not verify at
 * sign-in.
 */
import { eq } from "drizzle-orm";
import { createInterface } from "node:readline";

import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { generatePassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

/**
 * Mirrors `createLocalAccountIssuer("credential")` in @better-auth/core, which
 * is a transitive dependency and so not importable from here. Only used when
 * an account has no credential row yet (a Google-only sign-up); every existing
 * row already carries this value.
 */
const LOCAL_CREDENTIAL_ISSUER = "local:credential";

/** Reads a line without echoing it, so the password never reaches the scrollback. */
function promptHidden(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  return new Promise((resolve) => {
    const muted = rl as unknown as { _writeToOutput: (text: string) => void };
    const write = muted._writeToOutput.bind(rl);

    process.stdout.write(question);
    muted._writeToOutput = (text: string) => {
      // Let the newline through, swallow the characters themselves.
      if (text.includes("\n")) write("\n");
    };

    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const [email, ...flags] = process.argv.slice(2);
  const generate = flags.includes("--generate");
  const keepSessions = flags.includes("--keep-sessions");

  if (!email) {
    console.error("Usage: pnpm admin:set-password <email> [--generate] [--keep-sessions]");
    process.exit(1);
  }

  const [account] = await db
    .select({ id: userTable.id, email: userTable.email, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (!account) {
    console.error(`No account found for ${email}.`);
    process.exit(1);
  }

  let password: string;

  if (generate) {
    password = generatePassword();
  } else {
    password = await promptHidden(`New password for ${account.email}: `);
    const again = await promptHidden("Repeat it: ");
    if (password !== again) {
      console.error("Those two don't match. Nothing changed.");
      process.exit(1);
    }
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Too short — use at least ${MIN_PASSWORD_LENGTH} characters. Nothing changed.`);
    process.exit(1);
  }

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const credential = await ctx.internalAdapter.findCredentialAccount(account.id);

  if (credential) {
    await ctx.internalAdapter.updatePassword(account.id, hash);
  } else {
    // A Google-only account gains email sign-in as well; the Google link stays.
    await ctx.internalAdapter.linkAccount({
      userId: account.id,
      providerId: "credential",
      accountId: account.id,
      issuer: LOCAL_CREDENTIAL_ISSUER,
      password: hash,
    });
  }

  if (!keepSessions) {
    // A reset that leaves old sessions alive doesn't lock anyone out.
    await ctx.internalAdapter.deleteUserSessions(account.id);
  }

  console.log(`Password set for ${account.email}${credential ? "" : " (email sign-in added)"}.`);
  if (!keepSessions) console.log("All their existing sessions were signed out.");
  if (generate) console.log(`\n  ${password}\n\nCopy it now — it is not stored anywhere in readable form.`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
