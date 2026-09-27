/**
 * Password helpers shared by the browser, the server and the CLI.
 *
 * `MIN_PASSWORD_LENGTH` mirrors `emailAndPassword.minPasswordLength` in
 * lib/auth.ts. Better Auth enforces its own value server-side; this one exists
 * so the form can say so before a round trip, and the two must not drift.
 */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Deliberately excludes the characters people misread when a password is typed
 * out for someone else: O/0, l/1/I, and anything that needs escaping in a
 * shell. 20 characters from this 58-character alphabet is ~117 bits.
 */
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * A strong password, from the platform crypto source — `Math.random()` is not
 * one. Rejection sampling rather than `% ALPHABET.length`, which would make the
 * first few letters of the alphabet more likely than the rest.
 */
export function generatePassword(length = 20): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";

  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    for (const byte of bytes) {
      if (byte >= limit) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === length) break;
    }
  }

  return out;
}
