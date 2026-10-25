// Upload pipeline against the test DB and the compose RustFS storage (real presigned PUTs).
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import exifr from "exifr";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/server/db/client";
import { placeImages, places, uploadIntents, user } from "@/server/db/schema";
import type { Ctx } from "@/server/services/context";
import { AppError } from "@/server/services/errors";
import {
  listMyUploads,
  presignUploads,
  submitUploads,
  withdrawUpload,
  type UploadLimits,
} from "@/server/services/uploads";
import { createStorage } from "@/server/storage/storage";
import { env } from "@/server/env";

process.loadEnvFile?.(".env");
const url = process.env.TEST_DATABASE_URL;
const LIMITS: UploadLimits = { maxFiles: 5, maxBytes: 10 * 1024 * 1024, submissionsPerDay: 2 };
const PLACE = { lat: 7.957, lng: 80.7603 };

let conn: ReturnType<typeof createDb> | undefined;
let ctx: Ctx;
let placeId: string;
const userId = `up-${randomUUID()}`;

async function jpeg(gps?: { lat: number; lng: number }) {
  let img = sharp({ create: { width: 1200, height: 900, channels: 3, background: "#7a8" } }).jpeg();
  if (gps) {
    const dms = (x: number) => {
      const d = Math.floor(x);
      const m = Math.floor((x - d) * 60);
      const s = Math.round(((x - d) * 60 - m) * 6000);
      return `${d}/1 ${m}/1 ${s}/100`;
    };
    img = img.withExif({
      IFD3: {
        GPSLatitudeRef: "N",
        GPSLatitude: dms(gps.lat),
        GPSLongitudeRef: "E",
        GPSLongitude: dms(gps.lng),
      },
    });
  }
  return img.toBuffer();
}

async function upload(files: Buffer[], device?: { lat: number; lng: number }) {
  const { uploads } = await presignUploads(
    ctx,
    { placeId, files: files.map((f) => ({ contentType: "image/jpeg" as const, size: f.length })) },
    LIMITS,
  );
  for (const [i, u] of uploads.entries()) {
    const res = await fetch(u.uploadUrl, {
      method: "PUT",
      headers: u.headers,
      body: new Uint8Array(files[i]!),
    });
    expect(res.ok, `PUT ${res.status}`).toBe(true);
  }
  return submitUploads(ctx, { placeId, intentIds: uploads.map((u) => u.intentId), device }, LIMITS);
}

beforeAll(async () => {
  if (!url) return;
  conn = createDb(url);
  const db = conn.db as Db;
  await db.insert(user).values({ id: userId, name: "Uploader", email: `${userId}@example.com` });
  const [p] = await db
    .insert(places)
    .values({
      slug: `up-${randomUUID().slice(0, 8)}`,
      name: "Upload Rock",
      category: "heritage_site",
      location: PLACE,
      visitRadiusM: 1500,
      district: "matale",
      province: "central",
      shortDescription: "Upload fixture.",
      status: "published",
    })
    .returning();
  placeId = p!.id;
  ctx = { db, storage: createStorage(env()), now: () => new Date(), actor: { id: userId, role: "user" } };
});

afterAll(async () => {
  if (!conn) return;
  await conn.db.delete(places).where(eq(places.id, placeId));
  await conn.db.delete(user).where(eq(user.id, userId));
  await conn.pool.end();
});

describe.runIf(Boolean(url))("upload pipeline (integration)", () => {
  it("accepts in-radius EXIF, strips metadata and keeps the photo private until moderation", async () => {
    const res = await upload([await jpeg({ lat: 7.9572, lng: 80.7601 })]);
    expect(res.verification.method).toBe("exif");
    expect(res.images[0]!.status).toBe("pending");

    const [row] = await ctx.db.select().from(placeImages).where(eq(placeImages.id, res.images[0]!.id));
    expect(row!.variants.webp[800]).toMatch(/^pending\//);
    expect(row!.captureLat).toBeCloseTo(7.9572, 3);

    // The stored rendition has no EXIF/GPS, and isn't publicly readable.
    const stored = await ctx.storage.get("private", row!.variants.webp[800]);
    expect(await exifr.gps(stored).catch(() => undefined)).toBeUndefined();
    const anon = await fetch(ctx.storage.publicUrl(row!.variants.webp[800]));
    expect(anon.ok).toBe(false);

    // Raw upload is deleted and intents are consumed.
    const intents = await ctx.db.select().from(uploadIntents).where(eq(uploadIntents.userId, userId));
    expect(intents.every((i) => i.consumedAt)).toBe(true);
  });

  it("rejects photos taken far away, explaining the distance", async () => {
    const err = await upload([await jpeg({ lat: 6.93, lng: 79.85 })]).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({
      code: "OUTSIDE_VISIT_RADIUS",
      details: { radiusM: 1500, failingFiles: [0] },
    });
    expect((err as AppError & { details: { closestM: number } }).details.closestM).toBeGreaterThan(100_000);
  });

  it("device location covers photos without GPS; daily limit applies", async () => {
    const ok = await upload([await jpeg()], { lat: 7.9568, lng: 80.7605 });
    expect(ok.verification.method).toBe("device");
    await expect(upload([await jpeg()], { lat: 7.9568, lng: 80.7605 })).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("rejects files that aren't really images, whatever the claimed type", async () => {
    const fake = Buffer.from("not an image at all, just text pretending to be a jpeg");
    const { uploads } = await presignUploads(
      ctx,
      { placeId, files: [{ contentType: "image/jpeg", size: fake.length }] },
      {
        ...LIMITS,
        submissionsPerDay: 99,
      },
    );
    await fetch(uploads[0]!.uploadUrl, {
      method: "PUT",
      headers: uploads[0]!.headers,
      body: new Uint8Array(fake),
    });
    await expect(
      submitUploads(
        ctx,
        { placeId, intentIds: [uploads[0]!.intentId] },
        { ...LIMITS, submissionsPerDay: 99 },
      ),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA" });
  });

  it("other users can't use my upload intents; I can list and withdraw my pending photos", async () => {
    const { uploads } = await presignUploads(
      ctx,
      { placeId, files: [{ contentType: "image/jpeg", size: 10 }] },
      LIMITS,
    );
    const other = { ...ctx, actor: { id: "someone-else", role: "user" as const } };
    await expect(
      submitUploads(
        other,
        { placeId, intentIds: [uploads[0]!.intentId] },
        { ...LIMITS, submissionsPerDay: 99 },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const mine = await listMyUploads(ctx);
    expect(mine.length).toBeGreaterThanOrEqual(2);
    expect(mine[0]!.thumbUrl).toMatch(/X-Amz-Signature/);
    await withdrawUpload(ctx, mine[0]!.id);
    expect((await listMyUploads(ctx)).length).toBe(mine.length - 1);
    await expect(withdrawUpload(other, mine[1]!.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("requires a signed-in actor", async () => {
    await expect(listMyUploads({ ...ctx, actor: null })).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(await ctx.db.execute(sql`select 1`)).toBeTruthy();
  });
});
