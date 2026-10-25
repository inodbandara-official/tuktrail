import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

async function jpeg(gps?: { lat: number; lng: number }) {
  let img = sharp({ create: { width: 1200, height: 900, channels: 3, background: "#5a7" } }).jpeg();
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
async function signIn(page: Page, next: string) {
  const email = `e2e-${randomUUID().slice(0, 8)}@example.com`;
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

test.describe("sign-in and photo uploads", () => {
  test("upload page asks signed-out visitors to sign in", async ({ page }) => {
    await page.goto("/places/sigiriya/photos/new");
    await expect(page.getByRole("heading", { name: "Sign in to share photos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).last()).toHaveAttribute(
      "href",
      /\/sign-in\?next=%2Fplaces%2Fsigiriya%2Fphotos%2Fnew/,
    );
  });

  test("signed-in visitor uploads a verified photo and sees it waiting for review", async ({ page }) => {
    await signIn(page, "/places/sigiriya/photos/new");
    await page
      .getByLabel("Use my current location to confirm I'm here")
      .uncheck({ force: true })
      .catch(() => undefined);
    // The switch is a button; make sure it's off so verification uses the photo's GPS.
    const sw = page.getByRole("switch", { name: "Use my current location to confirm I'm here" });
    if ((await sw.getAttribute("aria-checked")) === "true") await sw.click();

    await page.locator("#photos").setInputFiles({
      name: "sigiriya.jpg",
      mimeType: "image/jpeg",
      buffer: await jpeg({ lat: 7.9572, lng: 80.7601 }),
    });
    await expect(page.getByText("1 photo selected")).toBeVisible();
    await page.getByLabel("Caption (optional)").fill("Lion's paws at the base of the summit stairs");
    await page.getByRole("button", { name: "Share 1 photo" }).click();

    await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible({ timeout: 45_000 });
    await page.getByRole("link", { name: "See my photos" }).click();
    await expect(page.getByRole("heading", { name: "My photos" })).toBeVisible();
    await expect(page.getByText("Waiting for review").first()).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Lion's paws at the base of the summit stairs" }),
    ).toBeVisible();

    // Not public yet.
    const detail = await (await page.request.get("/api/v1/places/sigiriya")).json();
    expect(JSON.stringify(detail)).not.toContain("Lion's paws");
  });

  test("photos taken elsewhere get a friendly explanation", async ({ page }) => {
    await signIn(page, "/places/sigiriya/photos/new");
    const sw = page.getByRole("switch", { name: "Use my current location to confirm I'm here" });
    if ((await sw.getAttribute("aria-checked")) === "true") await sw.click();
    await page.locator("#photos").setInputFiles({
      name: "colombo.jpg",
      mimeType: "image/jpeg",
      buffer: await jpeg({ lat: 6.93, lng: 79.85 }),
    });
    await page.getByRole("button", { name: "Share 1 photo" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "We couldn't confirm" });
    await expect(alert).toContainText("We couldn't confirm you were at Sigiriya Rock Fortress", {
      timeout: 45_000,
    });
    await expect(alert).toContainText(/within 1\.5 km/);
    await expect(alert).toContainText(/about 15\d km away/);
    await expect(page.getByText("No usable location")).toBeVisible();
  });

  test("account menu offers My photos and sign out", async ({ page }) => {
    const email = await signIn(page, "/");
    await page.getByRole("button", { name: /Account menu for/ }).click();
    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});
