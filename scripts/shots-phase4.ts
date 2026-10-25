// Phase 4 screenshots: sign-in, upload states and "My photos", in both viewports and themes.
// Signs in through the real magic-link flow (Mailpit). Usage: pnpm exec tsx scripts/shots-phase4.ts
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type BrowserContext, type BrowserContextOptions, type Page } from "@playwright/test";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";
const OUT = join("screenshots", "phase-4");

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
} satisfies Record<string, BrowserContextOptions>;

async function jpeg(gps: { lat: number; lng: number } | null, colour: string) {
  let img = sharp({ create: { width: 1600, height: 1200, channels: 3, background: colour } }).jpeg();
  if (gps) {
    const dms = (x: number) => {
      const d = Math.floor(x);
      const m = Math.floor((x - d) * 60);
      return `${d}/1 ${m}/1 ${Math.round(((x - d) * 60 - m) * 6000)}/100`;
    };
    img = img.withExif({
      IFD3: {
        GPSLatitudeRef: "N",
        GPSLatitude: dms(gps.lat),
        GPSLongitudeRef: "E",
        GPSLongitude: dms(gps.lng),
      },
    });
  }
  return img.toBuffer();
}

async function signIn(context: BrowserContext) {
  const email = `shots-${randomUUID().slice(0, 6)}@example.com`;
  await context.request.post(`${BASE}/api/auth/sign-in/magic-link`, {
    data: { email, callbackURL: "/" },
    headers: { Origin: BASE },
  });
  let link = "";
  for (let i = 0; i < 20 && !link; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const list = await (
      await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)
    ).json();
    const id = list.messages?.[0]?.ID;
    if (id)
      link = ((await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()).Text.match(
        /https?:\/\/\S+/,
      ) ?? [""])[0];
  }
  await context.request.get(link, { maxRedirects: 0 }).catch(() => undefined);
  return email;
}

async function settle(page: Page, ms = 600) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}

async function shot(page: Page, name: string, vp: string, scheme: string, fullPage = false) {
  const file = join(OUT, `${name}-${vp}-${scheme}.png`);
  // Full-page captures render sticky elements at the current scroll position; start at the top.
  if (fullPage) await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: file, fullPage });
  console.log(`✓ ${file}`);
}

const switchOff = async (page: Page) => {
  const sw = page.getByRole("switch", { name: "Use my current location to confirm I'm here" });
  if ((await sw.getAttribute("aria-checked")) === "true") await sw.click();
};

await mkdir(OUT, { recursive: true });
const near = await jpeg({ lat: 7.9572, lng: 80.7601 }, "#7a9a6a");
const near2 = await jpeg({ lat: 7.9568, lng: 80.7605 }, "#9a6a4a");
const far = await jpeg({ lat: 6.93, lng: 79.85 }, "#4a6a9a");

const browser = await chromium.launch();
try {
  for (const [vp, opts] of Object.entries(VIEWPORTS)) {
    for (const scheme of ["light", "dark"] as const) {
      // Signed out
      const anon = await browser.newContext({ ...opts, colorScheme: scheme, timezoneId: "Asia/Colombo" });
      const a = await anon.newPage();
      await a.goto(`${BASE}/sign-in?next=%2Fplaces%2Fsigiriya%2Fphotos%2Fnew`);
      await settle(a);
      await shot(a, "sign-in", vp, scheme);
      await a.getByLabel("Email address").fill("traveller@example.com");
      await a.getByRole("button", { name: "Email me a sign-in link" }).click();
      await a.getByRole("heading", { name: "Check your email" }).waitFor();
      await shot(a, "sign-in-check-email", vp, scheme);
      await a.goto(`${BASE}/places/sigiriya/photos/new`);
      await settle(a);
      await shot(a, "upload-signed-out", vp, scheme);
      await anon.close();

      // Signed in
      const ctx = await browser.newContext({ ...opts, colorScheme: scheme, timezoneId: "Asia/Colombo" });
      await ctx.addInitScript(() => localStorage.setItem("tuktrail.locationChoice", "manual"));
      await signIn(ctx);
      const p = await ctx.newPage();

      await p.goto(`${BASE}/places/sigiriya`);
      await settle(p, 1200);
      await shot(p, "place-with-credit-and-cta", vp, scheme, true);

      await p.goto(`${BASE}/places/sigiriya/photos/new`);
      await settle(p);
      await shot(p, "upload-empty", vp, scheme);

      await p.locator("#photos").setInputFiles([
        { name: "lion-paws.jpg", mimeType: "image/jpeg", buffer: near },
        { name: "summit.jpg", mimeType: "image/jpeg", buffer: near2 },
      ]);
      await p.getByLabel("Caption (optional)").fill("The lion's paws at the start of the summit stairway");
      await settle(p, 300);
      await shot(p, "upload-selected", vp, scheme, true);

      // Outside the radius
      await p.goto(`${BASE}/places/sigiriya/photos/new`);
      await settle(p);
      await switchOff(p);
      await p.locator("#photos").setInputFiles({ name: "colombo.jpg", mimeType: "image/jpeg", buffer: far });
      await p.getByRole("button", { name: "Share 1 photo" }).click();
      await p.getByRole("alert").filter({ hasText: "We couldn't confirm" }).waitFor({ timeout: 60_000 });
      await settle(p, 300);
      await shot(p, "upload-outside-radius", vp, scheme, true);

      // Success
      await p.goto(`${BASE}/places/sigiriya/photos/new`);
      await settle(p);
      await switchOff(p);
      await p
        .locator("#photos")
        .setInputFiles({ name: "lion-paws.jpg", mimeType: "image/jpeg", buffer: near });
      await p.getByRole("button", { name: "Share 1 photo" }).click();
      await p.getByRole("heading", { name: "Thank you!" }).waitFor({ timeout: 60_000 });
      await shot(p, "upload-success", vp, scheme);

      await p.goto(`${BASE}/me/uploads`);
      await settle(p, 800);
      await shot(p, "my-photos", vp, scheme, true);

      await p.goto(`${BASE}/`);
      await settle(p, 1500);
      await p.getByRole("button", { name: /Account menu for/ }).click();
      await p.waitForTimeout(300);
      await shot(p, "account-menu", vp, scheme);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
