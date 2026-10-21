// Accessibility + UX audit for given routes, both themes, mobile and desktop.
//  - axe-core (WCAG 2.2 A/AA rules)
//  - tap targets smaller than 44×44 px (inline links inside running text excluded)
//  - keyboard walk: every Tab stop must show a visible focus indicator
// Usage: pnpm a11y / /design      (app must be running at BASE_URL)
import AxeBuilder from "@axe-core/playwright";
import { chromium, type Page } from "@playwright/test";

const routes = process.argv.slice(2).filter((a) => a.startsWith("/"));
if (routes.length === 0) routes.push("/");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 } },
};

async function smallTapTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const els = document.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [role="button"], [role="switch"], [role="radio"], [tabindex]:not([tabindex="-1"])',
    );
    for (const el of els) {
      if (el.closest("dialog:not([open])") || el.classList.contains("sr-only")) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      // Inline links inside paragraphs are exempt (WCAG 2.5.8 inline exception).
      if (el.tagName === "A" && style.display === "inline" && el.closest("p, li")) continue;
      // A small control inside a larger labelled hit area (e.g. switch + label) counts the wrapper.
      const box = (el.closest("label") ?? el).getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const w = Math.max(r.width, box.width);
      const h = Math.max(r.height, box.height);
      if (w < 44 || h < 44) {
        const name = (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40);
        out.push(`${el.tagName.toLowerCase()} "${name}" ${Math.round(w)}×${Math.round(h)}`);
      }
    }
    return out;
  });
}

async function focusWalk(page: Page, maxStops = 60) {
  const missing: string[] = [];
  await page.locator("body").focus();
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      const outlined = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
      const ringed = s.boxShadow !== "none";
      // Stretched-link cards draw focus on a sibling overlay via :has(:focus-visible).
      const viaCard =
        !!el.closest("article")?.querySelector("[aria-hidden].pointer-events-none") &&
        el.matches(":focus-visible");
      const name = (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40);
      return { visible: outlined || ringed || viaCard, label: `${el.tagName.toLowerCase()} "${name}"` };
    });
    if (!info) break;
    if (!info.visible) missing.push(info.label);
  }
  return missing;
}

let problems = 0;
const browser = await chromium.launch();
try {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    for (const scheme of ["light", "dark"] as const) {
      const context = await browser.newContext({ ...vp, colorScheme: scheme });
      const page = await context.newPage();
      for (const route of routes) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
        const tag = `${route} [${vpName}/${scheme}]`;

        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        for (const v of axe.violations) {
          problems++;
          console.log(`✗ ${tag} axe ${v.id} (${v.impact}): ${v.help}`);
          for (const n of v.nodes.slice(0, 3)) console.log(`    ${n.target.join(" ")}`);
        }

        if (vpName === "mobile") {
          for (const s of await smallTapTargets(page)) {
            problems++;
            console.log(`✗ ${tag} tap target < 44px: ${s}`);
          }
        } else {
          for (const s of await focusWalk(page)) {
            problems++;
            console.log(`✗ ${tag} no visible focus: ${s}`);
          }
        }
        console.log(`• ${tag} checked`);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(problems ? `\n${problems} problem(s) found` : "\n✓ no problems found");
process.exit(problems ? 1 : 0);
