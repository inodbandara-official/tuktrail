// Shared e2e helpers: real magic-link sign-in via Mailpit, geotagged test photos, admin role.
import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import pg from "pg";
import sharp from "sharp";

process.loadEnvFile?.(".env");

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

export async function jpeg(gps?: { lat: number; lng: number }, background = "#5a7") {
  let img = sharp({ create: { width: 1200, height: 900, channels: 3, background } }).jpeg();
  if (gps) {
    const dms = (x: number) => {
      const d = Math.floor(x);
      const m = Math.floor((x - d) * 60);
      const s = Math.round(((x - d) * 60 - m) * 6000);
      return `${d}/1 ${m}/1 ${s}/100`;
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

/** Signs in through the real UI and the magic link delivered to Mailpit. */
export async function signIn(
  page: Page,
  next: string,
  email = `e2e-${randomUUID().slice(0, 8)}@example.com`,
) {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  let link = "";
  await expect
    .poll(async () => {
      const list = await (
        await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)
      ).json();
      const id = list.messages?.[0]?.ID;
      if (!id) return "";
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json();
      link = (msg.Text.match(/https?:\/\/\S+/) ?? [""])[0];
      return link;
    })
    .toMatch(/magic-link\/verify/);
  await page.goto(link);
  await expect(page).toHaveURL(new RegExp(`${next.replace(/\//g, "\\/")}$`));
  return email;
}

/** Gives an e2e account the admin role (the role can't be set through the app itself). */
export async function makeAdmin(email: string) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(`update "user" set role = 'admin' where email = $1`, [email.toLowerCase()]);
  } finally {
    await client.end();
  }
}

/** Signs a fresh visitor in and shares one in-radius photo of Sigiriya with the given caption. */
export async function shareSigiriyaPhoto(page: Page, caption: string, color = "#5a7") {
  await signIn(page, "/places/sigiriya/photos/new");
  const sw = page.getByRole("switch", { name: "Use my current location to confirm I'm here" });
  if ((await sw.getAttribute("aria-checked")) === "true") await sw.click();
  await page.locator("#photos").setInputFiles({
    name: "sigiriya.jpg",
    mimeType: "image/jpeg",
    buffer: await jpeg({ lat: 7.9572, lng: 80.7601 }, color),
  });
  await page.getByLabel("Caption (optional)").fill(caption);
  await page.getByRole("button", { name: "Share 1 photo" }).click();
  await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible({ timeout: 45_000 });
}
