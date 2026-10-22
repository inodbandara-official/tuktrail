// Captures routes at mobile (390×844) and desktop (1440×900), light and dark.
// Usage: pnpm screenshots --phase 2 [options] / /design
//   --click "Name"     press the button with this accessible name (repeatable, in order)
//   --geo 7.29,80.63   grant geolocation at this point;  --geo denied  to refuse it
//   --choice gps|manual  preset the remembered location choice (skips the explainer)
//   --wait 1500        extra settle time in ms after load/clicks (map tiles, animations)
//   --name suffix      file name suffix (default: derived from clicks)
//   --offline          go offline after loading (captures offline states)
//   --viewport-only    capture the viewport instead of the full page
// Requires the app running at BASE_URL (default http://localhost:3000).
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type BrowserContextOptions } from "@playwright/test";

const argv = process.argv.slice(2);
const routes: string[] = [];
const clicks: string[] = [];
const opts: Record<string, string | true> = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]!;
  if (a === "--click") clicks.push(argv[++i]!);
  else if (a === "--viewport-only" || a === "--offline") opts[a.slice(2)] = true;
  else if (a.startsWith("--")) opts[a.slice(2)] = argv[++i]!;
  else if (a.startsWith("/")) routes.push(a);
}
if (routes.length === 0) routes.push("/");

const phase = (opts.phase as string | undefined) ?? "adhoc";
const waitMs = Number(opts.wait ?? 0);
const geo = opts.geo as string | undefined;
const choice = opts.choice as string | undefined;
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = join("screenshots", `phase-${phase}`);

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
} satisfies Record<string, BrowserContextOptions>;

/** File name from the path only; query-string variants are told apart by --name. */
const slug = (route: string) => {
  const path = route.split("?")[0] ?? "/";
  return path === "/" ? "home" : path.replace(/^\//, "").replace(/[/.]+/g, "_");
};
const suffix =
  (opts.name as string | undefined) ?? clicks.map((c) => c.toLowerCase().replace(/\W+/g, "-")).join("+");

function contextOptions(): BrowserContextOptions {
  if (!geo) return {};
  if (geo === "denied") return { permissions: [] };
  const [latitude, longitude] = geo.split(",").map(Number);
  return { permissions: ["geolocation"], geolocation: { latitude: latitude!, longitude: longitude! } };
}

/** Wait for the network to go quiet, but don't hang on long-lived map tile traffic. */
async function settle(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => undefined);
  await page.waitForTimeout(300);
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    for (const scheme of ["light", "dark"] as const) {
      const context = await browser.newContext({
        ...vp,
        ...contextOptions(),
        colorScheme: scheme,
        locale: "en-GB",
        timezoneId: "Asia/Colombo",
      });
      if (choice) {
        await context.addInitScript((c) => localStorage.setItem("tuktrail.locationChoice", c), choice);
      }
      const page = await context.newPage();
      for (const route of routes) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "load" });
        await settle(page);
        await page.evaluate(() => document.fonts.ready);
        for (const name of clicks) {
          await page.getByRole("button", { name, exact: true }).first().click();
          await settle(page);
        }
        if (waitMs) await page.waitForTimeout(waitMs);
        if (opts.offline) {
          await context.setOffline(true);
          await page.waitForTimeout(400);
        }
        // Load lazy images (full-page captures only; scrolling would move a map screen).
        if (!opts["viewport-only"]) {
          await page.evaluate(async () => {
            for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
              window.scrollTo(0, y);
              await new Promise((r) => setTimeout(r, 120));
            }
            window.scrollTo(0, 0);
          });
        }
        await page.evaluate(() =>
          Promise.all(
            [...document.images]
              .filter((i) => !i.complete && i.loading !== "lazy")
              .map(
                (i) =>
                  new Promise((r) => {
                    i.addEventListener("load", r, { once: true });
                    i.addEventListener("error", r, { once: true });
                  }),
              ),
          ),
        );
        // The page must never scroll sideways.
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

        const file = join(outDir, `${slug(route)}${suffix ? `-${suffix}` : ""}-${vpName}-${scheme}.png`);
        await page.screenshot({ path: file, fullPage: !opts["viewport-only"] && clicks.length === 0 });
        console.log(`✓ ${file}`);
      }
      await context.setOffline(false);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
