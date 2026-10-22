// Nearby/towns services against the test database with a small, known fixture set.
import { inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/server/db/client";
import { places, towns } from "@/server/db/schema";
import type { Ctx } from "@/server/services/context";
import { AppError } from "@/server/services/errors";
import { findMapPoints, findNearby } from "@/server/services/nearby";
import { getTown, searchTowns } from "@/server/services/towns";
import type { Storage } from "@/server/storage/storage";
import { nearbyQuerySchema } from "@/shared/schemas/nearby";

process.loadEnvFile?.(".env");
const url = process.env.TEST_DATABASE_URL;

const KANDY = { lat: 7.2906, lng: 80.6337 };
// Fixture places at increasing distance from Kandy (slugs prefixed so cleanup is safe).
const FIXTURES = [
  {
    slug: "it-near-temple",
    name: "IT Near Temple",
    category: "temple",
    lat: 7.2936,
    lng: 80.6413,
    months: [1, 2],
  },
  { slug: "it-garden", name: "IT Botanic Garden", category: "garden", lat: 7.269, lng: 80.5966, months: [7] },
  { slug: "it-lake", name: "IT Hill Lake", category: "lake", lat: 6.9564, lng: 80.7728, months: [1, 7] },
  {
    slug: "it-falls",
    name: "IT Roadside Falls",
    category: "waterfall",
    lat: 6.8406,
    lng: 81.0547,
    months: [11],
  },
  {
    slug: "it-fort",
    name: "IT Harbour Fort",
    category: "heritage_site",
    lat: 9.6618,
    lng: 80.0088,
    months: [],
  },
] as const;
const TOWNS = [
  { slug: "it-kandy", name: "Itkandy", lat: KANDY.lat, lng: KANDY.lng, hub: true },
  { slug: "it-ella", name: "Itella", lat: 6.8667, lng: 81.0466, hub: false },
];

let conn: ReturnType<typeof createDb> | undefined;
let ctx: Ctx;

beforeAll(async () => {
  if (!url) return;
  conn = createDb(url);
  const db = conn.db as Db;
  await db.delete(places).where(sql`${places.slug} like 'it-%'`);
  await db.delete(towns).where(sql`${towns.slug} like 'it-%'`);
  await db.insert(places).values(
    FIXTURES.map((f) => ({
      slug: f.slug,
      name: f.name,
      category: f.category,
      location: { lat: f.lat, lng: f.lng },
      district: "kandy" as const,
      province: "central" as const,
      shortDescription: `${f.name} fixture.`,
      bestMonths: [...f.months],
      status: "published" as const,
    })),
  );
  await db.insert(places).values({
    slug: "it-draft",
    name: "IT Draft Place",
    category: "temple",
    location: KANDY,
    district: "kandy",
    province: "central",
    shortDescription: "Never listed.",
    status: "draft",
  });
  await db.insert(towns).values(
    TOWNS.map((t) => ({
      slug: t.slug,
      name: t.name,
      district: "kandy" as const,
      province: "central" as const,
      location: { lat: t.lat, lng: t.lng },
      isHub: t.hub,
    })),
  );
  ctx = {
    db,
    storage: { publicUrl: (k: string) => `https://cdn.test/${k}` } as Storage,
    now: () => new Date(),
    actor: null,
  };
});

afterAll(async () => {
  if (!conn) return;
  await conn.db.delete(places).where(sql`${places.slug} like 'it-%'`);
  await conn.db.delete(towns).where(
    inArray(
      towns.slug,
      TOWNS.map((t) => t.slug),
    ),
  );
  await conn.pool.end();
});

const q = (extra: Record<string, unknown> = {}) =>
  nearbyQuerySchema.parse({ lat: KANDY.lat, lng: KANDY.lng, radius_km: 100, ...extra });
const slugs = (items: { slug: string }[]) => items.map((i) => i.slug).filter((s) => s.startsWith("it-"));

describe.runIf(Boolean(url))("nearby service (integration)", () => {
  it("returns published places within the radius, nearest first, with distances", async () => {
    const res = await findNearby(ctx, q());
    expect(slugs(res.items)).toEqual(["it-near-temple", "it-garden", "it-lake", "it-falls"]);
    const d = res.items.map((i) => i.distanceM);
    expect(d).toEqual([...d].sort((a, b) => a - b));
    expect(res.items[0]!.distanceM).toBeGreaterThan(700);
    expect(res.items[0]!.distanceM).toBeLessThan(1000);
  });

  it("respects smaller radii", async () => {
    // Garden is ~4.8 km away: inside 5 km. Lake (~40 km) is not.
    expect(slugs((await findNearby(ctx, q({ radius_km: 5 }))).items)).toEqual([
      "it-near-temple",
      "it-garden",
    ]);
  });

  it("paginates with a cursor without gaps or duplicates", async () => {
    const all: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const res = await findNearby(ctx, q({ limit: 2, category: "temple,garden,lake,waterfall", cursor }));
      if (pages === 0) expect(res.total).toBe(4);
      else expect(res.total).toBeUndefined();
      all.push(...slugs(res.items));
      cursor = res.nextCursor ?? undefined;
      pages++;
    } while (cursor && pages < 10);
    expect(all).toEqual(["it-near-temple", "it-garden", "it-lake", "it-falls"]);
    expect(pages).toBe(2);
  });

  it("rejects a cursor from a different query", async () => {
    const first = await findNearby(ctx, q({ limit: 1 }));
    await expect(
      findNearby(ctx, q({ limit: 1, radius_km: 50, cursor: first.nextCursor! })),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("filters by category and by month", async () => {
    expect(slugs((await findNearby(ctx, q({ category: "lake,waterfall" }))).items)).toEqual([
      "it-lake",
      "it-falls",
    ]);
    expect(slugs((await findNearby(ctx, q({ month: 7 }))).items)).toEqual(["it-garden", "it-lake"]);
  });

  it("text search is island-wide, distance-sorted and typo-tolerant", async () => {
    // 'IT Harbour Fort' is ~280 km away, outside any radius.
    expect(slugs((await findNearby(ctx, q({ q: "harbour fort", radius_km: 5 }))).items)).toEqual(["it-fort"]);
    expect(slugs((await findNearby(ctx, q({ q: "IT Botanc Garden" }))).items)).toContain("it-garden");
    expect(slugs((await findNearby(ctx, q({ q: "100%_" }))).items)).toEqual([]);
  });

  it("never lists drafts", async () => {
    expect(slugs((await findNearby(ctx, q({ q: "draft" }))).items)).toEqual([]);
  });

  it("map points use the same filters without pagination", async () => {
    const pts = (await findMapPoints(ctx, q({ radius_km: 100 }))).filter((p) => p.slug.startsWith("it-"));
    expect(pts.map((p) => p.slug)).toEqual(["it-near-temple", "it-garden", "it-lake", "it-falls"]);
    expect(Object.keys(pts[0]!).sort()).toEqual(["category", "id", "lat", "lng", "name", "slug"]);
  });
});

describe.runIf(Boolean(url))("towns service (integration)", () => {
  it("finds towns by prefix and by typo", async () => {
    expect((await searchTowns(ctx, "Itel")).map((t) => t.slug)).toContain("it-ella");
    expect((await searchTowns(ctx, "Itkandi")).map((t) => t.slug)).toContain("it-kandy");
  });

  it("returns hubs for an empty query and 404s unknown slugs", async () => {
    expect((await searchTowns(ctx, undefined, 50)).map((t) => t.slug)).toContain("it-kandy");
    await expect(getTown(ctx, "it-nowhere")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
