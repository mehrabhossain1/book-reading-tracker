/**
 * Fails the moment the client bundle stops running on the oldest browser we
 * support — Safari 15.6 / iOS 15.8, which is where an iPhone 7 Plus stops.
 *
 *   pnpm check:legacy-safari      (after pnpm build)
 *
 * Two things can break that phone, and `browserslist` only prevents the first:
 *
 *   1. Syntax it cannot parse. One class static block in a chunk is a
 *      SyntaxError, the chunk never runs, and nothing on the page is
 *      interactive — no menu, no sign-in, no clue in the UI.
 *   2. Methods it does not have. Down-levelling never adds those; each one
 *      needs a line in src/instrumentation-client.ts.
 */
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const CHUNKS = new URL("../.next/static/chunks/", import.meta.url).pathname;
const POLYFILLS = new URL("../src/instrumentation-client.ts", import.meta.url).pathname;

/** Syntax Safari 15.6 cannot parse, whatever the semantics. */
const SYNTAX = {
  "class static initialisation block": /class[^{]*\{[^}]{0,200}?\bstatic\s*\{/,
  "RegExp lookbehind": /\(\?<[=!]/,
};

/** Methods newer than Safari 15.6. Each needs a polyfill, or avoiding. */
const BUILTINS = {
  "Array.prototype.toSorted": /\.toSorted\(/,
  "Array.prototype.toReversed": /\.toReversed\(/,
  "Array.prototype.toSpliced": /\.toSpliced\(/,
  "Array.fromAsync": /Array\.fromAsync\(/,
  "Object.groupBy": /Object\.groupBy\(/,
  "Map.groupBy": /Map\.groupBy\(/,
  "Promise.withResolvers": /Promise\.withResolvers\(/,
};

// A full parse is a stronger check than the patterns above, but acorn is only
// a transitive dependency here — say so rather than skipping in silence.
let acorn = null;
try {
  acorn = require("acorn");
} catch {
  console.warn("acorn not resolvable — running pattern checks only, without a full parse.");
}

const files = readdirSync(CHUNKS).filter((name) => name.endsWith(".js"));
if (files.length === 0) {
  console.error("No client chunks found — run `pnpm build` first.");
  process.exit(1);
}

const polyfilled = readFileSync(POLYFILLS, "utf8");
const problems = [];

for (const name of files) {
  const source = readFileSync(CHUNKS + name, "utf8");

  for (const [label, pattern] of Object.entries(SYNTAX)) {
    if (pattern.test(source)) problems.push(`${name}: ${label} — not parseable on Safari 15.6`);
  }

  for (const [label, pattern] of Object.entries(BUILTINS)) {
    // A method is fine as long as instrumentation-client.ts installs it first.
    const method = label.split(".").pop();
    if (pattern.test(source) && !polyfilled.includes(`"${method}"`)) {
      problems.push(`${name}: ${label} — add a polyfill to src/instrumentation-client.ts`);
    }
  }

  // ES2021 is a conservative floor: everything Safari 15.6 lacks is above it.
  // Class fields (ES2022) are fine on that browser, so they are not a failure.
  if (acorn) {
    try {
      acorn.parse(source, { ecmaVersion: 2022, sourceType: "script" });
    } catch (error) {
      problems.push(`${name}: does not parse even as ES2022 — ${error.message}`);
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) for Safari 15.6 / iOS 15.8:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`${files.length} client chunks are safe for Safari 15.6 / iOS 15.8.`);
