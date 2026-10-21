import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLOR_TOKENS, CONTRAST_PAIRS, contrastRatio } from "@/shared/design/tokens";

const css = readFileSync("src/app/globals.css", "utf8");

/** Extract `--token: #hex;` pairs from the first block matching `selector {`. */
function cssVars(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  expect(start, `selector ${selector} in globals.css`).toBeGreaterThanOrEqual(0);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]!.toUpperCase()]),
  );
}

describe("colour tokens", () => {
  it.each(["light", "dark"] as const)("%s values in globals.css match tokens.ts", (mode) => {
    const vars = mode === "light" ? cssVars(":root {") : cssVars(':root[data-theme="dark"] {');
    for (const [name, hex] of Object.entries(COLOR_TOKENS[mode])) {
      expect(vars[name], `--${name} (${mode})`).toBe(hex.toUpperCase());
    }
  });

  it("system-dark block matches forced-dark block", () => {
    expect(cssVars(':root:not([data-theme="light"]) {')).toEqual(cssVars(':root[data-theme="dark"] {'));
  });

  it.each(["light", "dark"] as const)("every declared pair meets WCAG AA in %s", (mode) => {
    for (const p of CONTRAST_PAIRS) {
      const ratio = contrastRatio(COLOR_TOKENS[mode][p.fg], COLOR_TOKENS[mode][p.bg]);
      expect(ratio, `${p.fg} on ${p.bg} (${mode})`).toBeGreaterThanOrEqual(p.min);
    }
  });

  it("contrastRatio matches known values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1);
  });
});
