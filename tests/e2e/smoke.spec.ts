import { expect, test } from "@playwright/test";

test("health endpoint reports database and PostGIS", async ({ request }) => {
  const res = await request.get("/api/v1/health");
  expect(res.ok()).toBe(true);
  expect(res.headers()["cache-control"]).toContain("no-store");
  const body = await res.json();
  expect(body).toMatchObject({ status: "ok", db: "ok" });
});

test("home renders with header, skip link and emergency numbers", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  await page.getByRole("button", { name: "Emergency" }).click();
  const dialog = page.getByRole("dialog", { name: "Emergency numbers" });
  await expect(dialog).toBeVisible();
  for (const n of ["119", "1990", "1912", "117"]) {
    await expect(dialog.locator(`a[href="tel:${n}"]`)).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("theme toggle cycles and persists across reloads", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme", /.+/);

  await page.getByRole("button", { name: /Colour theme/ }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /Colour theme/ }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("locale prefix is hidden for English and unknown routes 404", async ({ page }) => {
  await page.goto("/en/design");
  await expect(page).toHaveURL(/\/design$/);
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
