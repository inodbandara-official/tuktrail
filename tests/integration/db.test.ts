// Runs against TEST_DATABASE_URL (compose Postgres, `tuktrail_test`). Skips when unreachable.
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/server/db/client";
import { places } from "@/server/db/schema";
import { checkHealth } from "@/server/services/health";
import type { Storage } from "@/server/storage/storage";

process.loadEnvFile?.(".env");
const url = process.env.TEST_DATABASE_URL;

let conn: ReturnType<typeof createDb> | undefined;
let reachable = false;

beforeAll(async () => {
  if (!url) return;
  conn = createDb(url);
  reachable = await conn.pool
    .query("select 1")
    .then(() => true)
    .catch(() => false);
});

afterAll(async () => {
  if (conn && reachable) await conn.db.delete(places).where(eq(places.slug, "integration-test-place"));
  await conn?.pool.end();
});

describe.runIf(Boolean(url))("database (integration)", () => {
  const db = () => {
    if (!reachable)
      throw new Error("Test database unreachable — run `pnpm services:up` and `pnpm db:migrate --test`");
    return conn!.db as Db;
  };

  it("health check reports PostGIS", async () => {
    const report = await checkHealth({
      db: db(),
      storage: {} as Storage,
      now: () => new Date(),
      actor: null,
    });
    expect(report.db).toBe("ok");
    expect(report.postgis).toMatch(/^3\./);
  });

  it("round-trips geography points and supports ST_DWithin", async () => {
    await db().delete(places).where(eq(places.slug, "integration-test-place"));
    const [row] = await db()
      .insert(places)
      .values({
        slug: "integration-test-place",
        name: "Integration Test Place",
        category: "viewpoint",
        location: { lat: 7.957, lng: 80.7603 },
        district: "matale",
        province: "central",
        shortDescription: "Integration test fixture.",
      })
      .returning();
    expect(row!.location.lat).toBeCloseTo(7.957, 6);
    expect(row!.location.lng).toBeCloseTo(80.7603, 6);

    const near = await db().execute<{ d: number }>(sql`
      select ST_Distance(location, ST_MakePoint(80.7553, 7.9547)::geography) as d
      from places where slug = 'integration-test-place'
        and ST_DWithin(location, ST_MakePoint(80.7553, 7.9547)::geography, 1500)`);
    expect(near.rows).toHaveLength(1);
    expect(Number(near.rows[0]!.d)).toBeGreaterThan(400);
    expect(Number(near.rows[0]!.d)).toBeLessThan(700);
  });

  it("enforces check constraints", async () => {
    await expect(
      db()
        .execute(sql`insert into places (slug, name, category, location, district, province, short_description, best_months)
        values ('bad-months', 'Bad', 'other', ST_MakePoint(80,7)::geography, 'kandy', 'central', 'x', '{13}')`),
    ).rejects.toMatchObject({ cause: { constraint: "places_best_months_range" } });
  });
});
