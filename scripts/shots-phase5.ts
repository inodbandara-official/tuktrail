// Phase 5 screenshots: admin overview, photo review (queue, reject panel, decided), places list,
// place editor, new-place validation, the visitor's view of a rejection, and the admin's
// not-found for visitors. Usage: pnpm exec tsx --env-file=.env scripts/shots-phase5.ts
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser, type BrowserContextOptions, type Page } from "@playwright/test";
import pg from "pg";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";
const OUT = join("screenshots", "phase-5");

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
} satisfies Record<string, BrowserContextOptions>;

type State = Awaited<ReturnType<import("@playwright/test").BrowserContext["storageState"]>>;

/** A visitor-style photo: the reviewed Sigiriya photo (if cached), cropped, with in-radius GPS. */
async function visitorPhoto(crop: { left: number; top: number }, lat: number, lng: number) {
  const cached = ".cache/place-photos/sigiriya.img";
  const base = existsSync(cached)
    ? sharp(await readFile(cached)).resize({ width: 2000 })
    : sharp({ create: { width: 2000, height: 1500, channels: 3, background: "#7a9a6a" } });
  const dms = (x: number) => {
    const d = Math.floor(x);
    const m = Math.floor((x - d) * 60);
    return `${d}/1 ${m}/1 ${Math.round(((x - d) * 60 - m) * 6000)}/100`;
  };
  const cropped = await base
    .toBuffer()
    .then((b) => sharp(b).extract({ left: crop.left, top: crop.top, width: 1400, height: 1050 }).toBuffer());
  return sharp(cropped)
    .jpeg({ quality: 85 })
    .withExif({
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: dms(lat), GPSLongitudeRef: "E", GPSLongitude: dms(lng) },
    })
    .toBuffer();
}

async function signedInState(browser: Browser, email: string): Promise<State> {
  const ctx = await browser.newContext();
  await ctx.request.post(`${BASE}/api/auth/sign-in/magic-link`, {
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
  await ctx.request.get(link, { maxRedirects: 0 }).catch(() => undefined);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

async function settle(page: Page, ms = 700) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}

async function shot(page: Page, name: string, vp: string, scheme: string, fullPage = false) {
  const file = join(OUT, `${name}-${vp}-${scheme}.png`);
  if (fullPage) {
    // Scroll through like a visitor so lazy maps mount and draw, then pin sticky bars in place:
    // full-page captures draw sticky elements at the first viewport's edge, mid-page.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = page.viewportSize()!.height * 0.8;
    for (let y = 0; y < height; y += step) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2500);
    await page.addStyleTag({ content: ".sticky{position:static!important}" });
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.screenshot({ path: file, fullPage });
  console.log(`✓ ${file}`);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const created: string[] = [];

try {
  const adminEmail = `shots-admin-${randomUUID().slice(0, 6)}@example.com`;
  const visitorEmail = `shots-visitor-${randomUUID().slice(0, 6)}@example.com`;
  const adminState = await signedInState(browser, adminEmail);
  await db.query(`update "user" set role = 'admin', name = 'Upul' where email = $1`, [adminEmail]);
  const visitorState = await signedInState(browser, visitorEmail);
  await db.query(`update "user" set name = 'Nadeesha Fernando' where email = $1`, [visitorEmail]);

  // Two visitor photos of Sigiriya: one stays pending, one gets rejected.
  const visitor = await browser.newContext({ storageState: visitorState });
  const sigiriya = await (await visitor.request.get(`${BASE}/api/v1/places/sigiriya`)).json();
  const share = async (buf: Buffer, caption: string) => {
    const pre = await (
      await visitor.request.post(`${BASE}/api/v1/uploads/presign`, {
        data: { placeId: sigiriya.id, files: [{ contentType: "image/jpeg", size: buf.length }] },
      })
    ).json();
    const u = pre.uploads[0];
    await fetch(u.uploadUrl, { method: "PUT", headers: u.headers, body: new Uint8Array(buf) });
    const sub = await (
      await visitor.request.post(`${BASE}/api/v1/submissions`, {
        data: { placeId: sigiriya.id, intentIds: [u.intentId], caption },
      })
    ).json();
    created.push(sub.images[0].id);
    return sub.images[0].id as string;
  };
  await share(
    await visitorPhoto({ left: 300, top: 200 }, 7.9569, 80.7598),
    "Morning light on the rock from the water gardens",
  );
  const toReject = await share(
    await visitorPhoto({ left: 0, top: 0 }, 7.9574, 80.7611),
    "View from the summit",
  );
  const adminCtx = await browser.newContext({ storageState: adminState });
  await adminCtx.request.post(`${BASE}/api/v1/admin/images/${toReject}/reject`, {
    data: {
      reason: "people_privacy",
      note: "Lovely view, but two faces are clearly recognisable. Feel free to share a crop without them.",
    },
  });
  await adminCtx.close();
  await visitor.close();

  for (const [vp, opts] of Object.entries(VIEWPORTS)) {
    for (const scheme of ["light", "dark"] as const) {
      const base = { ...opts, colorScheme: scheme, timezoneId: "Asia/Colombo" } as const;

      // Visitors: the admin area doesn't exist for them.
      const anon = await browser.newContext(base);
      const a = await anon.newPage();
      await a.goto(`${BASE}/admin`);
      await settle(a);
      await shot(a, "admin-visitor-not-found", vp, scheme);
      await anon.close();

      const vctx = await browser.newContext({ ...base, storageState: visitorState });
      const v = await vctx.newPage();
      await v.goto(`${BASE}/me/uploads`);
      await settle(v, 1000);
      await shot(v, "my-photos-with-rejection", vp, scheme, true);
      await vctx.close();

      const ctx = await browser.newContext({ ...base, storageState: adminState });
      await ctx.addInitScript(() => localStorage.setItem("tuktrail.locationChoice", "manual"));
      const p = await ctx.newPage();

      await p.goto(`${BASE}/`);
      await settle(p);
      await p.getByRole("button", { name: /Account menu for/ }).click();
      await shot(p, "account-menu-admin", vp, scheme);

      await p.goto(`${BASE}/admin`);
      await settle(p);
      await shot(p, "admin-overview", vp, scheme, true);

      await p.goto(`${BASE}/admin/moderation`);
      await settle(p, 2500); // let the mini map draw
      await shot(p, "moderation-queue", vp, scheme, true);

      const card = p.getByRole("article").first();
      await card.getByRole("button", { name: "Don't approve…" }).click();
      await card.getByLabel(/Too blurry, dark or small/).check();
      await card.getByRole("button", { name: "Don't approve this photo" }).scrollIntoViewIfNeeded();
      await settle(p, 300);
      await shot(p, "moderation-reject-panel", vp, scheme);

      await p.goto(`${BASE}/admin/moderation?status=rejected`);
      await settle(p);
      await shot(p, "moderation-decided", vp, scheme);

      await p.goto(`${BASE}/admin/places`);
      await settle(p);
      await shot(p, "admin-places", vp, scheme);

      await p.goto(`${BASE}/admin/places/${sigiriya.id}`);
      await settle(p, 2500);
      await shot(p, "admin-place-edit", vp, scheme, true);

      await p.goto(`${BASE}/admin/places/new`);
      await settle(p, 1500);
      await p.getByLabel("Name", { exact: true }).fill("Ella Spice Garden");
      await p.getByRole("button", { name: "Create place" }).click();
      await settle(p, 300);
      await shot(p, "admin-place-new-errors", vp, scheme);

      await ctx.close();
    }
  }
} finally {
  // Remove the visitor photos this script created (rows + files) via the admin API.
  if (created.length) {
    const email = `shots-cleanup-${randomUUID().slice(0, 6)}@example.com`;
    const state = await signedInState(browser, email);
    await db.query(`update "user" set role = 'admin' where email = $1`, [email]);
    const ctx = await browser.newContext({ storageState: state });
    for (const id of created) await ctx.request.delete(`${BASE}/api/v1/admin/images/${id}`);
    await ctx.close();
  }
  await db.end();
  await browser.close();
}
