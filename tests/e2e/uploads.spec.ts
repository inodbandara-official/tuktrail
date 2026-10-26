import { expect, test } from "@playwright/test";
import { jpeg, signIn } from "./helpers";

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

    // Withdraw it again so test photos don't pile up in the review queue.
    const mine = await (await page.request.get("/api/v1/me/uploads")).json();
    for (const u of mine.items)
      expect((await page.request.delete(`/api/v1/me/uploads/${u.id}`)).status()).toBe(204);
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
