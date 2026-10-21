// Captures every given route at mobile (390×844) and desktop (1440×900), light and dark.
// Usage: pnpm screenshots --phase 1 / /design
// Requires the app running at BASE_URL (default http://localhost:3000).
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type BrowserContextOptions } from "@playwright/test";

const args = process.argv.slice(2);
const phaseIdx = args.indexOf("--phase");
const phase = phaseIdx >= 0 ? args[phaseIdx + 1] : "adhoc";
const fullIdx = args.indexOf("--viewport-only");
// --click "Emergency": press the button with that accessible name before capturing (e.g. open a sheet).
const clickIdx = args.indexOf("--click");
const clickName = clickIdx >= 0 ? args[clickIdx + 1] : undefined;
const routes = args.filter((a, i) => a.startsWith("/") && i !== phaseIdx + 1 && i !== clickIdx + 1);
if (routes.length === 0) routes.push("/");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = join("screenshots", `phase-${phase}`);

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
} satisfies Record<string, BrowserContextOptions>;

const slug = (route: string) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/[/?=&]+/g, "_"));

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    for (const scheme of ["light", "dark"] as const) {
      const context = await browser.newContext({
        ...vp,
        colorScheme: scheme,
        locale: "en-GB",
        timezoneId: "Asia/Colombo",
      });
      const page = await context.newPage();
      for (const route of routes) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        // Scroll through the page so lazy images load, then wait for them.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
          await Promise.all(
            [...document.images]
              .filter((i) => !i.complete)
              .map(
                (i) =>
                  new Promise((r) => {
                    i.addEventListener("load", r, { once: true });
                    i.addEventListener("error", r, { once: true });
                  }),
              ),
          );
        });
        // Flag horizontal overflow: the page must never scroll sideways.
        const overflow = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          if (document.documentElement.scrollWidth <= vw) return [];
          return [...document.querySelectorAll("body *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.right > vw + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed";
            })
            .slice(0, 5)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
        });
        if (overflow.length)
          console.warn(`! horizontal overflow on ${route} (${vpName}):\n  ${overflow.join("\n  ")}`);
        if (clickName) {
          await page.getByRole("button", { name: clickName, exact: true }).first().click();
          await page.waitForTimeout(250);
        }
        const suffix = clickName ? `-${clickName.toLowerCase().replace(/\W+/g, "-")}` : "";
        const file = join(outDir, `${slug(route)}${suffix}-${vpName}-${scheme}.png`);
        await page.screenshot({ path: file, fullPage: fullIdx < 0 && !clickName });
        console.log(`✓ ${file}`);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
