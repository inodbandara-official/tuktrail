import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { PlaceDetail, PlaceSummary } from "@/shared/schemas/place";
import { placeImages, places, towns } from "../db/schema";
import type { Ctx } from "./context";
import { toImageDto, toPlaceSummary } from "./mappers";

/** Published place summaries by slug, in the order requested. */
export async function getPlaceSummariesBySlugs(ctx: Ctx, slugs: string[]): Promise<PlaceSummary[]> {
  if (slugs.length === 0) return [];
  const rows = await ctx.db
    .select({ place: places, hero: placeImages })
    .from(places)
    .leftJoin(placeImages, eq(placeImages.id, places.heroImageId))
    .where(and(inArray(places.slug, slugs), eq(places.status, "published")));

  const bySlug = new Map(rows.map((r) => [r.place.slug, toPlaceSummary(r.place, r.hero, ctx.storage)]));
  return slugs.flatMap((s) => bySlug.get(s) ?? []);
}

/** One published place per category (first by name). Used by the design system page. */
export async function getOnePlacePerCategory(ctx: Ctx): Promise<PlaceSummary[]> {
  const rows = await ctx.db
    .selectDistinctOn([places.category], { place: places, hero: placeImages })
    .from(places)
    .leftJoin(placeImages, eq(placeImages.id, places.heroImageId))
    .where(eq(places.status, "published"))
    .orderBy(places.category, places.name);
  return rows.map((r) => toPlaceSummary(r.place, r.hero, ctx.storage));
}

/** Full public detail for one published place, or null. Images: official first, then newest. */
export async function getPlaceDetail(ctx: Ctx, slug: string): Promise<PlaceDetail | null> {
  const [place] = await ctx.db
    .select()
    .from(places)
    .where(and(eq(places.slug, slug), eq(places.status, "published")))
    .limit(1);
  if (!place) return null;

  const images = await ctx.db
    .select()
    .from(placeImages)
    .where(and(eq(placeImages.placeId, place.id), eq(placeImages.status, "approved")))
    .orderBy(sql`${placeImages.source} = 'official' desc`, desc(placeImages.createdAt));

  const point = sql`ST_SetSRID(ST_MakePoint(${place.location.lng}, ${place.location.lat}), 4326)::geography`;
  const [town] = await ctx.db
    .select({
      slug: towns.slug,
      name: towns.name,
      distanceM: sql<number>`ST_Distance(${towns.location}, ${point})`,
    })
    .from(towns)
    .orderBy(sql`${towns.location} <-> ${point}`)
    .limit(1);

  const hero = images.find((i) => i.id === place.heroImageId) ?? images[0] ?? null;
  const summary = toPlaceSummary(place, hero, ctx.storage);
  // Hero first in the gallery, then the rest.
  const ordered = hero ? [hero, ...images.filter((i) => i.id !== hero.id)] : images;

  return {
    ...summary,
    fullDescription: place.fullDescription,
    visitRadiusM: place.visitRadiusM,
    openingHours: place.openingHours ?? null,
    feeForeignLkr: place.feeForeignLkr,
    feeLocalLkr: place.feeLocalLkr,
    dressCode: place.dressCode,
    howToGetThere: place.howToGetThere,
    safetyNotes: place.safetyNotes,
    images: ordered.map((i) => toImageDto(i, ctx.storage)),
    nearestTown: town
      ? { slug: town.slug, name: town.name, distanceM: Math.round(Number(town.distanceM)) }
      : null,
    updatedAt: place.updatedAt.toISOString(),
  };
}

/** Slugs of all published places (static generation, sitemap). */
export async function listPublishedSlugs(ctx: Ctx): Promise<string[]> {
  const rows = await ctx.db
    .select({ slug: places.slug })
    .from(places)
    .where(eq(places.status, "published"))
    .orderBy(asc(places.slug));
  return rows.map((r) => r.slug);
}
