import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/server/db/client";
import { placeImages, places, towns } from "@/server/db/schema";
import type { Ctx } from "@/server/services/context";
import { getPlaceDetail, listPublishedSlugs } from "@/server/services/places";
import type { Storage } from "@/server/storage/storage";

process.loadEnvFile?.(".env");
const url = process.env.TEST_DATABASE_URL;
let conn: ReturnType<typeof createDb> | undefined;
let ctx: Ctx;

const variants = (k: string) => ({
  avif: { 400: `${k}-400.avif`, 800: `${k}-800.avif`, 1600: `${k}-1600.avif` },
  webp: { 400: `${k}-400.webp`, 800: `${k}-800.webp`, 1600: `${k}-1600.webp` },
});

beforeAll(async () => {
  if (!url) return;
  conn = createDb(url);
  const db = conn.db as Db;
  await db.delete(places).where(sql`${places.slug} like 'pd-%'`);
  await db.delete(towns).where(sql`${towns.slug} like 'pd-%'`);
  await db.insert(towns).values([
    {
      slug: "pd-near",
      name: "Pdnear",
      district: "matale",
      province: "central",
      location: { lat: 7.95, lng: 80.75 },
    },
    {
      slug: "pd-far",
      name: "Pdfar",
      district: "matale",
      province: "central",
      location: { lat: 8.5, lng: 81.2 },
    },
  ]);
  const [p] = await db
    .insert(places)
    .values({
      slug: "pd-rock",
      name: "PD Rock",
      category: "heritage_site",
      location: { lat: 7.957, lng: 80.7603 },
      district: "matale",
      province: "central",
      shortDescription: "Fixture rock.",
      fullDescription: "Longer **markdown** text.",
      howToGetThere: "By tuk-tuk.",
      status: "published",
    })
    .returning();
  await db.insert(places).values({
    slug: "pd-draft",
    name: "PD Draft",
    category: "other",
    location: { lat: 7.9, lng: 80.7 },
    district: "matale",
    province: "central",
    shortDescription: "Hidden.",
    status: "draft",
  });
  const base = {
    placeId: p!.id,
    width: 1600,
    height: 1000,
    lqip: "data:image/webp;base64,AA",
    altText: "Alt",
  };
  const [official] = await db
    .insert(placeImages)
    .values([
      { ...base, variants: variants("official"), source: "official" as const, status: "approved" as const },
      {
        ...base,
        variants: variants("user"),
        source: "user" as const,
        status: "approved" as const,
        captureLat: 7.9571,
        captureLng: 80.7604,
      },
      { ...base, variants: variants("pending"), source: "user" as const, status: "pending" as const },
    ])
    .returning();
  await db
    .update(places)
    .set({ heroImageId: official!.id })
    .where(sql`${places.id} = ${p!.id}`);
  ctx = {
    db,
    storage: { publicUrl: (k: string) => `https://cdn.test/${k}` } as Storage,
    now: () => new Date(),
    actor: null,
  };
});

afterAll(async () => {
  if (!conn) return;
  await conn.db.delete(places).where(sql`${places.slug} like 'pd-%'`);
  await conn.db.delete(towns).where(sql`${towns.slug} like 'pd-%'`);
  await conn.pool.end();
});

describe.runIf(Boolean(url))("place detail service (integration)", () => {
  it("returns the place with approved images (hero first) and nearest town", async () => {
    const d = (await getPlaceDetail(ctx, "pd-rock"))!;
    expect(d.name).toBe("PD Rock");
    expect(d.howToGetThere).toBe("By tuk-tuk.");
    expect(d.images).toHaveLength(2);
    expect(d.images[0]!.source).toBe("official");
    expect(d.heroImage?.id).toBe(d.images[0]!.id);
    expect(d.nearestTown?.slug).toBe("pd-near");
    expect(d.nearestTown!.distanceM).toBeGreaterThan(500);
    expect(d.nearestTown!.distanceM).toBeLessThan(2000);
  });

  it("never exposes capture coordinates or pending images", () => {
    return getPlaceDetail(ctx, "pd-rock").then((d) => {
      const json = JSON.stringify(d);
      expect(json).not.toMatch(/7\.9571|80\.7604|captureLat|pending-/);
    });
  });

  it("hides drafts and unknown slugs", async () => {
    expect(await getPlaceDetail(ctx, "pd-draft")).toBeNull();
    expect(await getPlaceDetail(ctx, "pd-nope")).toBeNull();
    const slugs = await listPublishedSlugs(ctx);
    expect(slugs).toContain("pd-rock");
    expect(slugs).not.toContain("pd-draft");
  });
});
