import { sql } from "drizzle-orm";
import type { Ctx } from "./context";

export interface HealthReport {
  status: "ok" | "degraded";
  db: "ok" | "down";
  postgis: string | null;
  time: string;
}

export async function checkHealth(ctx: Ctx): Promise<HealthReport> {
  try {
    const res = await ctx.db.execute<{ v: string }>(sql`select postgis_lib_version() as v`);
    return { status: "ok", db: "ok", postgis: res.rows[0]?.v ?? null, time: ctx.now().toISOString() };
  } catch {
    return { status: "degraded", db: "down", postgis: null, time: ctx.now().toISOString() };
  }
}
