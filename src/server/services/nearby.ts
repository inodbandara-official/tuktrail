import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { MapPoint, MapPointsQuery, NearbyQuery, NearbyResponse } from "@/shared/schemas/nearby";
import { placeImages, places } from "../db/schema";
import type { Ctx } from "./context";
import { decodeCursor, encodeCursor, queryFingerprint } from "./cursor";
import { toPlaceSummary } from "./mappers";

const MAX_MAP_POINTS = 500;

/** Escape LIKE wildcards in user input. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

function buildFilters(q: MapPointsQuery) {
  const origin = sql`ST_SetSRID(ST_MakePoint(${q.lng}, ${q.lat}), 4326)::geography`;
  const distance = sql<number>`ST_Distance(${places.location}, ${origin})`;

  const where: SQL[] = [eq(places.status, "published")];
  if (q.q) {
    // Island-wide text search on name and district, still ordered by distance. The fuzzy threshold
    // (0.62) keeps common typos ("sigirya", "mirisa") without matching "fort" to "Forest".
    const pattern = `%${likeEscape(q.q)}%`;
    where.push(sql`(
      ${places.name} ILIKE ${pattern}
      OR replace(${places.district}::text, '_', ' ') ILIKE ${pattern}
      OR word_similarity(${q.q}, ${places.name}) > 0.62
    )`);
  } else {
    where.push(sql`ST_DWithin(${places.location}, ${origin}, ${q.radius_km * 1000})`);
  }
  if (q.category?.length) where.push(inArray(places.category, q.category));
  if (q.month) where.push(sql`${places.bestMonths} @> ARRAY[${q.month}]::smallint[]`);

  return { distance, where };
}

export async function findNearby(ctx: Ctx, q: NearbyQuery): Promise<NearbyResponse> {
  const { distance, where } = buildFilters(q);
  const fingerprint = queryFingerprint([
    q.lat,
    q.lng,
    q.radius_km,
    q.category ?? [],
    q.month ?? 0,
    q.q ?? "",
  ]);

  const pageWhere = [...where];
  if (q.cursor) {
    const c = decodeCursor(q.cursor, fingerprint);
    pageWhere.push(sql`(${distance}, ${places.id}) > (${c.d}, ${c.id}::uuid)`);
  }

  const rows = await ctx.db
    .select({ place: places, hero: placeImages, distanceM: distance })
    .from(places)
    .leftJoin(placeImages, eq(placeImages.id, places.heroImageId))
    .where(and(...pageWhere))
    .orderBy(asc(distance), asc(places.id))
    .limit(q.limit + 1);

  const hasMore = rows.length > q.limit;
  const page = hasMore ? rows.slice(0, q.limit) : rows;
  const last = page.at(-1);

  let total: number | undefined;
  if (!q.cursor) {
    const [res] = await ctx.db
      .select({ n: sql<number>`count(*)::int` })
      .from(places)
      .where(and(...where));
    total = res?.n ?? 0;
  }

  return {
    items: page.map((r) => {
      const s = toPlaceSummary(r.place, r.hero, ctx.storage, Number(r.distanceM));
      return { ...s, distanceM: s.distanceM ?? 0 };
    }),
    nextCursor:
      hasMore && last ? encodeCursor({ d: Number(last.distanceM), id: last.place.id }, fingerprint) : null,
    ...(total === undefined ? {} : { total }),
  };
}

/** All matching places as lightweight points for the map (clustered client-side). */
export async function findMapPoints(ctx: Ctx, q: MapPointsQuery): Promise<MapPoint[]> {
  const { distance, where } = buildFilters(q);
  const rows = await ctx.db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      category: places.category,
      location: places.location,
    })
    .from(places)
    .where(and(...where))
    .orderBy(asc(distance))
    .limit(MAX_MAP_POINTS);
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    lat: r.location.lat,
    lng: r.location.lng,
  }));
}
