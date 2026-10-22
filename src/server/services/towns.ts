import { asc, desc, eq, sql } from "drizzle-orm";
import type { Town } from "@/shared/schemas/nearby";
import { towns } from "../db/schema";
import type { Ctx } from "./context";
import { AppError } from "./errors";

const toTown = (r: typeof towns.$inferSelect): Town => ({
  slug: r.slug,
  name: r.name,
  district: r.district,
  province: r.province,
  lat: r.location.lat,
  lng: r.location.lng,
});

/** Town search for the manual location fallback. Empty query returns traveller hubs. */
export async function searchTowns(ctx: Ctx, q: string | undefined, limit = 8): Promise<Town[]> {
  if (!q) {
    const rows = await ctx.db
      .select()
      .from(towns)
      .where(eq(towns.isHub, true))
      .orderBy(asc(towns.name))
      .limit(limit);
    return rows.map(toTown);
  }
  const prefix = `${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const rows = await ctx.db
    .select()
    .from(towns)
    .where(
      sql`${towns.name} ILIKE ${prefix} OR ${towns.name} ILIKE ${"% " + prefix} OR similarity(${towns.name}, ${q}) > 0.3`,
    )
    .orderBy(
      desc(sql`${towns.name} ILIKE ${prefix}`),
      desc(sql`similarity(${towns.name}, ${q})`),
      desc(towns.isHub),
      asc(towns.name),
    )
    .limit(limit);
  return rows.map(toTown);
}

export async function getTown(ctx: Ctx, slug: string): Promise<Town> {
  const [row] = await ctx.db.select().from(towns).where(eq(towns.slug, slug)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Town not found");
  return toTown(row);
}
