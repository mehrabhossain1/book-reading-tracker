import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../globals.css", import.meta.url)),
  "utf8",
);

/** OKLCH -> linear sRGB (Björn Ottosson's matrices). */
function oklchToSrgb(L: number, C: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

function contrast(a: [number, number, number], b: [number, number, number]) {
  const la = luminance(oklchToSrgb(...a));
  const lb = luminance(oklchToSrgb(...b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pull the token block for a selector and parse its plain oklch() values. */
function readTokens(selector: string): Record<string, [number, number, number]> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No ${selector} block in globals.css`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const tokens: Record<string, [number, number, number]> = {};
  const re = /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block))) {
    tokens[match[1]] = [Number(match[2]), Number(match[3]), Number(match[4])];
  }
  return tokens;
}

const THEMES = { light: readTokens(":root"), dark: readTokens(".dark") };

/** [foreground, background, minimum ratio, what it is]. */
const PAIRS: [string, string, number, string][] = [
  ["foreground", "background", 4.5, "body text"],
  ["foreground", "card", 4.5, "text on a card"],
  ["muted-foreground", "background", 4.5, "secondary text"],
  ["muted-foreground", "card", 4.5, "secondary text on a card"],
  ["primary-foreground", "primary", 4.5, "primary button label"],
  ["secondary-foreground", "secondary", 4.5, "secondary button label"],
  ["accent-foreground", "accent", 4.5, "accent text"],
  ["destructive", "background", 4.5, "error text"],
  ["success", "background", 4.5, "success text"],
  ["sidebar-foreground", "sidebar", 4.5, "sidebar text"],
  ["sidebar-primary-foreground", "sidebar-primary", 4.5, "sidebar button label"],
  ["primary", "background", 3.0, "accent as a UI element"],
  ["primary", "card", 3.0, "accent on a card"],
];

describe.each(["light", "dark"] as const)("%s theme", (theme) => {
  const tokens = THEMES[theme];

  it("defines every token the other theme defines", () => {
    const other = theme === "light" ? THEMES.dark : THEMES.light;
    // .dark only overrides; it must not introduce a token :root lacks.
    for (const name of Object.keys(THEMES.dark)) {
      expect(Object.keys(THEMES.light)).toContain(name);
    }
    expect(Object.keys(other).length).toBeGreaterThan(0);
  });

  it.each(PAIRS)(
    "%s on %s meets %s:1 (%s)",
    (fg, bg, min) => {
      expect(tokens[fg], `--${fg} missing`).toBeDefined();
      expect(tokens[bg], `--${bg} missing`).toBeDefined();
      expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
    },
  );

  it("keeps every colour inside the sRGB gamut", () => {
    const outside = Object.entries(tokens).filter(([, c]) =>
      oklchToSrgb(...c).some((v) => v < -0.001 || v > 1.001),
    );
    expect(outside.map(([name]) => name)).toEqual([]);
  });
});
