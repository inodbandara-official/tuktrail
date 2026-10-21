// Single source of truth for colour tokens. Mirrored in src/app/globals.css
// (a unit test keeps the two in sync and checks WCAG contrast).
// Palette: "Roadside Ceylon" — laterite earth, tea-country green, Indian Ocean teal, sand.

export const COLOR_TOKENS = {
  light: {
    bg: "#F4ECDD",
    surface: "#FFFBF4",
    "surface-sunk": "#EBE0CC",
    ink: "#1F1A15",
    "ink-muted": "#5A4F44",
    line: "#D8CAB3",
    "line-strong": "#8C7C69",
    laterite: "#9A3B1F",
    "laterite-ink": "#FFFBF4",
    "laterite-soft": "#F3DCCF",
    tea: "#2E5A36",
    "tea-soft": "#DCE8D6",
    ocean: "#0B6670",
    "ocean-soft": "#D3E8E8",
    monsoon: "#3B4A5A",
    warn: "#7A4F00",
    "warn-soft": "#F6E3B8",
    danger: "#A3221B",
    focus: "#0B6670",
  },
  dark: {
    bg: "#16120E",
    surface: "#211B16",
    "surface-sunk": "#0F0C09",
    ink: "#F4ECDD",
    "ink-muted": "#C2B5A4",
    line: "#3A3029",
    "line-strong": "#7D6E5E",
    laterite: "#E8875F",
    "laterite-ink": "#1F1A15",
    "laterite-soft": "#3D2418",
    tea: "#8CC79A",
    "tea-soft": "#1E2E21",
    ocean: "#5CC4CC",
    "ocean-soft": "#14302F",
    monsoon: "#A9B9CA",
    warn: "#F0B84A",
    "warn-soft": "#33260C",
    danger: "#FF8A7A",
    focus: "#5CC4CC",
  },
} as const;

export type ColorToken = keyof (typeof COLOR_TOKENS)["light"];

/** Foreground/background pairs that must meet WCAG AA (4.5:1 text, 3:1 UI). */
export const CONTRAST_PAIRS: { fg: ColorToken; bg: ColorToken; min: number; use: string }[] = [
  { fg: "ink", bg: "bg", min: 4.5, use: "body text on page" },
  { fg: "ink", bg: "surface", min: 4.5, use: "body text on cards" },
  { fg: "ink-muted", bg: "bg", min: 4.5, use: "secondary text on page" },
  { fg: "ink-muted", bg: "surface", min: 4.5, use: "secondary text on cards" },
  { fg: "ink-muted", bg: "surface-sunk", min: 4.5, use: "secondary text on sunk panels" },
  { fg: "laterite-ink", bg: "laterite", min: 4.5, use: "primary button label" },
  { fg: "laterite", bg: "surface", min: 4.5, use: "accent text on cards" },
  { fg: "laterite", bg: "laterite-soft", min: 4.5, use: "active chip label" },
  { fg: "tea", bg: "surface", min: 4.5, use: "tea text on cards" },
  { fg: "tea", bg: "tea-soft", min: 4.5, use: "tea badge" },
  { fg: "ocean", bg: "surface", min: 4.5, use: "links on cards" },
  { fg: "ocean", bg: "bg", min: 4.5, use: "links on page" },
  { fg: "ocean", bg: "ocean-soft", min: 4.5, use: "ocean badge" },
  { fg: "monsoon", bg: "surface", min: 4.5, use: "info text" },
  { fg: "warn", bg: "warn-soft", min: 4.5, use: "unverified badge" },
  { fg: "danger", bg: "surface", min: 4.5, use: "error text" },
  { fg: "line-strong", bg: "surface", min: 3, use: "input borders" },
  { fg: "focus", bg: "bg", min: 3, use: "focus ring on page" },
  { fg: "focus", bg: "surface", min: 3, use: "focus ring on cards" },
];

/** Category accent used for markers, chips and placeholder art (paired with a unique icon). */
export const CATEGORY_TONE = {
  temple: "laterite",
  heritage_site: "laterite",
  beach: "ocean",
  waterfall: "ocean",
  lake: "ocean",
  national_park: "tea",
  wildlife: "tea",
  garden: "tea",
  hike: "tea",
  viewpoint: "monsoon",
  museum: "monsoon",
  other: "monsoon",
} as const satisfies Record<string, ColorToken>;

// WCAG 2.x relative luminance / contrast ratio.
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
export function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
