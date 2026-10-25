import { expect, test } from "@playwright/test";

test.describe("place detail", () => {
  test("opens from the list and shows practical info", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("tuktrail.locationChoice", "manual"));
    await page.goto("/?town=kandy&r=10");
    await page.getByRole("button", { name: "Temple of the Sacred Tooth Relic", exact: true }).click();
    await page.getByRole("link", { name: "View details" }).click();

    await expect(page).toHaveURL(/\/places\/temple-of-the-tooth$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Temple of the Sacred Tooth Relic");
    await expect(page.getByText("Kandy District, Central Province")).toBeVisible();
    await expect(page.getByText("Details not yet verified")).toBeVisible();

    const info = page.getByRole("region", { name: "Practical info" });
    await expect(info.getByRole("heading", { name: "What to wear" })).toBeVisible();
    await expect(info.getByRole("heading", { name: "How to get there" })).toBeVisible();
    await expect(info.getByText(/Nearest town: Kandy/)).toBeVisible();
    // Never invented: no fee or hours rows, but an honest note instead.
    await expect(info.getByRole("heading", { name: "Entry fees", exact: true })).toHaveCount(0);
    await expect(info.getByRole("heading", { name: "Opening hours", exact: true })).toHaveCount(0);
    await expect(info.getByRole("heading", { name: "Fees and opening hours" })).toBeVisible();
  });

  test("read more, directions, JSON-LD", async ({ page }) => {
    await page.goto("/places/sigiriya");
    const more = page.getByRole("button", { name: "Read more" });
    await expect(page.getByText(/water gardens at its base/)).toBeHidden();
    await more.click();
    await expect(page.getByText(/water gardens at its base/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");

    await expect(page.getByRole("link", { name: "Directions (opens Google Maps)" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=7.957%2C80.7603",
    );

    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(ld).toMatchObject({ "@type": "TouristAttraction", name: "Sigiriya Rock Fortress" });
    await expect(page).toHaveTitle(/Sigiriya Rock Fortress/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  });

  test("photo lightbox opens and closes with the keyboard", async ({ page }) => {
    await page.goto("/places/galle-fort");
    await page.waitForLoadState("networkidle"); // let the gallery hydrate before clicking
    await page.getByRole("button", { name: /Open photo 1 of/ }).click();
    const viewer = page.getByRole("dialog", { name: "Photo viewer" });
    await expect(viewer).toBeVisible();
    await expect(viewer.getByText(/1 of \d/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });

  test("distance from a remembered GPS fix is computed on the device", async ({ page }) => {
    await page.addInitScript(() =>
      sessionStorage.setItem("tuktrail.lastFix", JSON.stringify({ lat: 7.291, lng: 80.634 })),
    );
    const apiCalls: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/")) apiCalls.push(r.url());
    });
    await page.goto("/places/temple-of-the-tooth");
    await expect(page.getByRole("img", { name: /from you/ })).toBeVisible();
    expect(apiCalls.filter((u) => /lat=|7\.291/.test(u))).toEqual([]);
  });

  test("unknown places show the designed not-found page and aren't indexed", async ({ page }) => {
    await page.goto("/places/no-such-place");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  });

  test("share falls back to copying the link", async ({ page, context, browserName }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop" || browserName !== "chromium",
      "clipboard permission is Chromium desktop only",
    );
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      // Force the fallback path even where the Web Share API exists.
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    });
    await page.goto("/places/mirissa-beach");
    await page.waitForLoadState("networkidle"); // the share button needs hydrated JS
    await page.getByRole("button", { name: "Share", exact: true }).click();
    await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/places\/mirissa-beach$/);
  });
});

test("place API and OG image", async ({ request }) => {
  const res = await request.get("/api/v1/places/sigiriya");
  expect(res.ok()).toBe(true);
  const body = await res.json();
  expect(body).toMatchObject({ slug: "sigiriya", feeForeignLkr: null, openingHours: null });
  expect(body.nearestTown).toMatchObject({ slug: "sigiriya" });
  expect((await request.get("/api/v1/places/nope")).status()).toBe(404);
  const og = await request.get("/places/sigiriya/opengraph-image");
  expect(og.headers()["content-type"]).toBe("image/png");
});
