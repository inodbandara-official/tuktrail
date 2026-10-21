// Prints WCAG contrast ratios for every token pair in both themes. Exit 1 on failure.
import { COLOR_TOKENS, CONTRAST_PAIRS, contrastRatio } from "../src/shared/design/tokens";

let failed = 0;
for (const mode of ["light", "dark"] as const) {
  for (const p of CONTRAST_PAIRS) {
    const r = contrastRatio(COLOR_TOKENS[mode][p.fg], COLOR_TOKENS[mode][p.bg]);
    const ok = r >= p.min;
    if (!ok) failed++;
    console.log(
      `${ok ? "ok  " : "FAIL"} ${mode.padEnd(5)} ${r.toFixed(2).padStart(5)}  ${p.fg} on ${p.bg} (${p.use})`,
    );
  }
}
process.exit(failed ? 1 : 0);
