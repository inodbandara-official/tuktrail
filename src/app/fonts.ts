import { Atkinson_Hyperlegible_Next, Young_Serif } from "next/font/google";

/** Headings: warm, chunky letterpress serif. Single weight by design. */
export const headingFont = Young_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

/** Body and UI: built for legibility (distinct I/l/1, 0/O) — good in harsh sun. */
export const bodyFont = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  // next/font has no metric overrides for this family yet; use a plain fallback stack.
  adjustFontFallback: false,
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
});
