import { expect, test, type Page } from "@playwright/test";

const KANDY = { latitude: 7.2906, longitude: 80.6337 };

const firstCardTitle = (page: Page) => page.locator("article h3").first();
const markers = (page: Page) => page.locator("[data-map-marker]");

test.describe("location", () => {
  test("first visit explains, then sorts by GPS without putting coordinates in the URL", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ permissions: ["geolocation"], geolocation: KANDY });
    const page = await ctx.newPage();
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "See what's around you" })).toBeVisible();
    await page.getByRole("button", { name: "Use my location" }).click();

    // Nearest first: the top card is under 1 km from central Kandy, and the temple is listed.
    await expect(page.locator("article").first().getByRole("img", { name: / m$/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Temple of the Sacred Tooth Relic", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Near you/ })).toBeVisible();
    await expect(markers(page).first()).toBeAttached({ timeout: 20_000 });
    expect(page.url()).not.toMatch(/7\.29|80\.63|lat=|lng=/);

    // Remembered: the explainer doesn't come back.
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Temple of the Sacred Tooth Relic", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "See what's around you" })).toHaveCount(0);
    await ctx.close();
  });

  test("denied location falls back to Colombo, then a chosen town", async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: [] });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Use my location" }).click();

    await expect(page.getByText("Location is turned off")).toBeVisible();
    await expect(page.getByRole("button", { name: /Colombo \(default\)/ })).toBeVisible();

    await page.getByRole("button", { name: "Choose a town" }).click();
    const dialog = page.getByRole("dialog", { name: "Where are you?" });
    await dialog.getByLabel("Search towns").fill("Ell");
    await dialog.getByRole("button", { name: /^Ella/ }).click();

    await expect(page).toHaveURL(/town=ella/);
    await expect(firstCardTitle(page)).toHaveText("Ella Rock");
    await ctx.close();
  });

  test("tap a point on the map as the location", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("tuktrail.locationChoice", "manual"));
    await page.goto("/");
    await page.getByRole("button", { name: /Colombo \(default\)\. Change location/ }).click();
    await page.getByRole("button", { name: "Pick a spot on the map" }).click();
    await expect(page.getByText("Tap the map to set your location")).toBeVisible();

    const canvas = page.locator(".maplibregl-canvas");
    await expect(canvas).toBeVisible({ timeout: 20_000 });
    const box = (await canvas.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.25);

    await expect(page).toHaveURL(/at=\d+\.\d{1,3}%2C\d+\.\d{1,3}|at=\d+\.\d{1,3},\d+\.\d{1,3}/);
    await expect(page.getByRole("button", { name: /Near your map pin/ })).toBeVisible();
  });
});

test.describe("filters and search", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("tuktrail.locationChoice", "manual"));
  });

  test("category and radius live in the URL and survive a reload", async ({ page }) => {
    await page.goto("/?town=ella&r=50&cat=waterfall");
    await expect(page.getByText(/places? within 50 km/)).toBeVisible();
    const categories = page.locator("article p.uppercase");
    await expect(categories.first()).toHaveText(/Waterfall/);
    for (const text of await categories.allTextContents()) expect(text).toMatch(/Waterfall/);

    await page.getByRole("button", { name: "Hike", exact: true }).click();
    await expect(page).toHaveURL(/cat=waterfall(%2C|,)hike/);
    await page.reload();
    await expect(page.getByRole("button", { name: "Hike", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("article h3", { hasText: "Ella Rock" })).toBeVisible();
  });

  test("text search is island-wide", async ({ page }) => {
    await page.goto("/?town=jaffna&r=5");
    await expect(page.getByText(/within 5 km/).first()).toBeVisible();
    await page.getByRole("searchbox", { name: "Search places or districts" }).fill("galle");
    await expect(page).toHaveURL(/q=galle/);
    await expect(page.getByText(/\d+ matches for “galle”/)).toBeVisible();
    await expect(page.locator("article h3", { hasText: "Galle Fort" })).toBeVisible();
  });

  test("empty results offer a wider radius", async ({ page }) => {
    await page.goto("/?town=jaffna&r=5&cat=museum");
    await expect(page.getByRole("heading", { name: "Nothing within 5 km" })).toBeVisible();
    await page.getByRole("button", { name: "Search within 10 km" }).click();
    await expect(page).toHaveURL(/r=10/);
  });
});

test.describe("map and list sync", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("tuktrail.locationChoice", "manual"));
    await page.goto("/?town=kandy&r=10");
    await page.waitForFunction(() => "__ttMap" in window, null, { timeout: 20_000 });
  });

  test("selecting a card highlights its marker, pans the map and offers directions", async ({ page }) => {
    await page.getByRole("button", { name: "Temple of the Sacred Tooth Relic", exact: true }).click();

    const directions = page.getByRole("link", { name: "Directions" });
    await expect(directions).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=7.2936%2C80.6413",
    );
    await expect(directions).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "View details" })).toHaveAttribute(
      "href",
      "/places/temple-of-the-tooth",
    );
    await expect(
      page.getByRole("button", { name: "Temple of the Sacred Tooth Relic, Temple" }),
    ).toHaveAttribute("aria-pressed", "true");

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const map = (window as unknown as { __ttMap: { getCenter(): { lat: number; lng: number } } })
              .__ttMap;
            const c = map.getCenter();
            return Math.hypot(c.lat - 7.2936, c.lng - 80.6413);
          }),
        { timeout: 5_000 },
      )
      .toBeLessThan(0.01);
  });

  test("tapping a marker selects its card", async ({ page }) => {
    const marker = page.getByRole("button", { name: "Royal Botanic Gardens, Peradeniya, Garden" });
    await marker.click({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: "Royal Botanic Gardens, Peradeniya", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

test("nearby API responses are never cached", async ({ request }) => {
  const res = await request.get("/api/v1/places/nearby?lat=7.29&lng=80.63");
  expect(res.ok()).toBe(true);
  expect(res.headers()["cache-control"]).toMatch(/no-store/);
  const body = await res.json();
  expect(body.items[0]).not.toHaveProperty("captureLat");
});
