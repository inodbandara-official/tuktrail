import { and, eq, inArray } from "drizzle-orm";
import type { PlaceSummary } from "@/shared/schemas/place";
import { placeImages, places } from "../db/schema";
import type { Ctx } from "./context";
import { toPlaceSummary } from "./mappers";

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
