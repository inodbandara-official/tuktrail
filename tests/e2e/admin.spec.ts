import { randomUUID } from "node:crypto";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { makeAdmin, shareSigiriyaPhoto, signIn } from "./helpers";

/** A separate browser session signed in as a (freshly promoted) admin. */
async function adminPage(browser: Browser, next: string): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const email = `e2e-admin-${randomUUID().slice(0, 8)}@example.com`;
  await signIn(page, "/", email);
  await makeAdmin(email);
  await page.goto(next);
  return page;
}

/** Find a moderation card by the visitor's (unique) caption, paging through the queue if needed. */
async function findCard(page: Page, caption: string) {
  const item = page.getByRole("article").filter({ has: page.getByText(caption, { exact: true }) });
  const more = page.getByRole("button", { name: "Show more photos" });
  await expect(page.getByRole("heading", { name: "Photo review", level: 1 })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
  for (let i = 0; i < 20 && !(await item.isVisible()); i++) {
    if (!(await more.isVisible())) break;
    await more.click();
    await expect(more.or(item).first()).toBeVisible();
  }
  await expect(item).toBeVisible();
  return item;
}

test.describe("admin and moderation", () => {
  test("the admin area is invisible to visitors", async ({ page }) => {
    await page.goto("/admin/moderation");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    expect((await page.request.get("/api/v1/admin/moderation")).status()).toBe(404);

    await signIn(page, "/admin");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await page.getByRole("button", { name: /Account menu for/ }).click();
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  });

  test("admin approves a visitor photo and it goes live on the place page", async ({ page, browser }) => {
    test.slow();
    const caption = `Summit stairs ${randomUUID().slice(0, 6)}`;
    await shareSigiriyaPhoto(page, caption);

    const admin = await adminPage(browser, "/");
    await admin.getByRole("button", { name: /Account menu for/ }).click();
    await admin.getByRole("link", { name: "Admin" }).click();
    await expect(admin.getByRole("heading", { name: /^Hello,/ })).toBeVisible();
    await admin.getByRole("link", { name: /Photo review/ }).click();

    const item = await findCard(admin, caption);
    await expect(item).toContainText("Visit confirmed by the photo's own location");
    await expect(item.getByRole("region", { name: /where the photo was taken/ })).toBeVisible();
    await item.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(admin.getByRole("status").filter({ hasText: "approved and published" })).toBeAttached();
    await expect(item).toHaveCount(0);

    // Public now, on the (revalidated) place page.
    await page.goto("/places/sigiriya");
    await page
      .getByRole("button", { name: /Open photo/ })
      .first()
      .waitFor();
    await expect(page.locator(`img[alt="${caption}"]`).first()).toBeAttached();

    // The visitor sees it as live.
    await page.goto("/me/uploads");
    await expect(page.getByText("Live").first()).toBeVisible();

    // Clean up so Sigiriya's gallery doesn't fill with test photos.
    const list = await (await admin.request.get("/api/v1/admin/moderation?status=approved&limit=50")).json();
    const id = list.items.find((i: { caption: string }) => i.caption === caption)?.id;
    expect(id).toBeTruthy();
    expect((await admin.request.delete(`/api/v1/admin/images/${id}`)).status()).toBe(204);
    await admin.context().close();
  });

  test("admin rejects a photo with a reason the visitor can read", async ({ page, browser }) => {
    test.slow();
    const caption = `Blurry wall ${randomUUID().slice(0, 6)}`;
    await shareSigiriyaPhoto(page, caption, "#a75");

    const admin = await adminPage(browser, "/admin/moderation");
    const item = await findCard(admin, caption);
    await item.getByRole("button", { name: "Don't approve…" }).click();
    await item.getByRole("button", { name: "Don't approve this photo" }).click();
    await expect(item.getByRole("alert")).toHaveText("Choose a reason first.");
    await item.getByLabel(/Too blurry, dark or small/).check();
    await item.getByLabel("Note for the visitor (optional)").fill("The wall is out of focus.");
    await item.getByRole("button", { name: "Don't approve this photo" }).click();
    await expect(item).toHaveCount(0);
    await admin.context().close();

    await page.goto("/me/uploads");
    await expect(page.getByText("Not approved").first()).toBeVisible();
    await expect(
      page.getByText("It's too blurry, dark or small to help other travellers.").first(),
    ).toBeVisible();
    await expect(page.getByText("The wall is out of focus.", { exact: false }).first()).toBeVisible();
  });

  test("admin creates a draft place, then deletes it", async ({ browser }) => {
    test.slow(); // signs in through Mailpit and renders the location map
    const admin = await adminPage(browser, "/admin/places/new");
    const name = `E2E Falls ${randomUUID().slice(0, 6)}`;

    // Empty submit shows an error summary that links to the fields.
    await admin.getByRole("button", { name: "Create place" }).click();
    await expect(admin.getByRole("alert").filter({ hasText: "Please fix" })).toBeFocused();

    await admin.getByLabel("Name", { exact: true }).fill(name);
    await expect(admin.getByLabel("Web address")).toHaveValue(/^e2e-falls-/);
    await admin.getByLabel("Category").selectOption("waterfall");
    await admin.getByLabel("District", { exact: true }).selectOption("badulla");
    await admin.getByLabel("Latitude").fill("6.8212");
    await admin.getByLabel("Longitude").fill("80.9431");
    await admin.getByLabel("Short description").fill("A test waterfall created by the end-to-end suite.");
    await admin.getByRole("button", { name: "Create place" }).click();

    await expect(admin.getByText("Place created.")).toBeVisible();
    await expect(admin.getByRole("heading", { name, level: 1 })).toBeVisible();
    // Drafts are not public.
    const slug = await admin.getByLabel("Web address").inputValue();
    expect((await admin.request.get(`/api/v1/places/${slug}`)).status()).toBe(404);

    admin.once("dialog", (d) => void d.accept());
    await admin.getByRole("button", { name: "Delete place" }).click();
    await expect(admin.getByRole("heading", { name: "Places", level: 1 })).toBeVisible();
    await admin.context().close();
  });
});
