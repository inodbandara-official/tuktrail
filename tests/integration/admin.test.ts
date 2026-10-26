// Moderation + place admin services against the test DB and the compose RustFS storage.
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PLACEHOLDER_ATTRIBUTION } from "@/shared/constants/places";
import type { PlaceInput } from "@/shared/schemas/place";
import { createDb, type Db } from "@/server/db/client";
import { placeImages, places, uploadSubmissions, user, visits } from "@/server/db/schema";
import { processImage } from "@/server/lib/images";
import {
  addOfficialImage,
  createPlace,
  deleteImage,
  deletePlace,
  getAdminPlace,
  listAdminPlaces,
  setHeroImage,
  updatePlace,
} from "@/server/services/admin-places";
import type { Ctx } from "@/server/services/context";
import {
  approveImage,
  listModerationQueue,
  publicKeyFor,
  rejectImage,
  variantKeys,
} from "@/server/services/moderation";
import { listMyUploads } from "@/server/services/uploads";
import { createStorage } from "@/server/storage/storage";
import { env } from "@/server/env";

process.loadEnvFile?.(".env");
const url = process.env.TEST_DATABASE_URL;

let conn: ReturnType<typeof createDb> | undefined;
let admin: Ctx;
let visitor: Ctx;
let placeId: string;
const adminId = `adm-${randomUUID()}`;
const visitorId = `vis-${randomUUID()}`;
const PLACE = { lat: 7.957, lng: 80.7603 };

const photo = (color = "#7a8") =>
  sharp({ create: { width: 900, height: 600, channels: 3, background: color } })
    .jpeg()
    .toBuffer();

/** A visitor photo waiting for review, stored the way submitUploads stores it. */
async function pendingPhoto(color?: string) {
  const imageId = randomUUID();
  const out = await processImage(await photo(color), `pending/${placeId}/${imageId}`);
  await Promise.all(out.files.map((f) => admin.storage.put("private", f.key, f.body, f.contentType)));
  const [sub] = await admin.db
    .insert(uploadSubmissions)
    .values({ userId: visitorId, placeId, verificationMethod: "exif", distanceM: 40 })
    .returning();
  await admin.db.insert(placeImages).values({
    id: imageId,
    placeId,
    submissionId: sub!.id,
    variants: out.variants,
    width: out.width,
    height: out.height,
    lqip: out.lqip,
    altText: "Visitor photo",
    source: "user",
    uploadedBy: visitorId,
    status: "pending",
    captureLat: 7.9572,
    captureLng: 80.7601,
  });
  return { imageId, keys: variantKeys(out.variants) };
}

async function exists(bucket: "public" | "private", key: string) {
  return (await admin.storage.size(bucket, key)) !== null;
}

const baseInput = (slug: string): PlaceInput => ({
  slug,
  name: "Admin Test Falls",
  category: "waterfall",
  location: { lat: 6.8, lng: 80.9 },
  visitRadiusM: 800,
  district: "badulla",
  shortDescription: "A place created by the admin integration test.",
  fullDescription: "",
  openingHours: null,
  feeForeignLkr: null,
  feeLocalLkr: null,
  dressCode: null,
  howToGetThere: null,
  bestMonths: [],
  safetyNotes: null,
  isVerified: false,
  status: "draft",
});

beforeAll(async () => {
  if (!url) return;
  conn = createDb(url);
  const db = conn.db as Db;
  await db.insert(user).values([
    { id: adminId, name: "Admin", email: `${adminId}@example.com`, role: "admin" },
    { id: visitorId, name: "Visitor", email: `${visitorId}@example.com` },
  ]);
  const [p] = await db
    .insert(places)
    .values({
      slug: `mod-${randomUUID().slice(0, 8)}`,
      name: "Moderation Rock",
      category: "heritage_site",
      location: PLACE,
      visitRadiusM: 1500,
      district: "matale",
      province: "central",
      shortDescription: "Moderation fixture.",
      status: "published",
    })
    .returning();
  placeId = p!.id;
  const storage = createStorage(env());
  admin = { db, storage, now: () => new Date(), actor: { id: adminId, role: "admin" } };
  visitor = { ...admin, actor: { id: visitorId, role: "user" } };

  // The fixture place starts with only a generated placeholder as its main image.
  const phId = randomUUID();
  const out = await processImage(await photo("#ccc"), `places/${placeId}/${phId}`);
  await Promise.all(out.files.map((f) => storage.put("public", f.key, f.body, f.contentType)));
  await db.insert(placeImages).values({
    id: phId,
    placeId,
    variants: out.variants,
    width: out.width,
    height: out.height,
    lqip: out.lqip,
    altText: "Placeholder",
    source: "official",
    attribution: PLACEHOLDER_ATTRIBUTION,
    status: "approved",
  });
  await db.update(places).set({ heroImageId: phId }).where(eq(places.id, placeId));
});

afterAll(async () => {
  if (!conn) return;
  await conn.db.delete(places).where(eq(places.id, placeId));
  await conn.db.delete(user).where(eq(user.id, adminId));
  await conn.db.delete(user).where(eq(user.id, visitorId));
  await conn.pool.end();
});

describe.runIf(Boolean(url))("moderation (integration)", () => {
  it("only admins can moderate", async () => {
    await expect(listModerationQueue(visitor, { status: "pending", limit: 10 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      approveImage({ ...admin, actor: null }, randomUUID(), { makeHero: false }),
    ).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("lists pending photos oldest first with capture point and verification, paging by cursor", async () => {
    const a = await pendingPhoto();
    const b = await pendingPhoto("#a87");
    const page1 = await listModerationQueue(admin, { status: "pending", limit: 1 });
    const mine = [] as string[];
    let cursor: string | undefined = undefined;
    let page = page1;
    for (;;) {
      mine.push(...page.items.filter((i) => i.place.id === placeId).map((i) => i.id));
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
      page = await listModerationQueue(admin, { status: "pending", limit: 1, cursor });
    }
    expect(mine).toEqual([a.imageId, b.imageId]);
    const item = page1.items[0]!;
    expect(item.previewUrl).toMatch(/X-Amz-Signature/);
    const fixture = (await listModerationQueue(admin, { status: "pending", limit: 50 })).items.find(
      (i) => i.id === a.imageId,
    )!;
    expect(fixture).toMatchObject({
      capturePoint: { lat: 7.9572, lng: 80.7601 },
      verification: { method: "exif", distanceM: 40 },
      uploader: { name: "Visitor" },
      place: { heroIsPlaceholder: true },
    });
    // Tidy: reject both so later tests start clean.
    await rejectImage(admin, a.imageId, { reason: "duplicate" });
    await rejectImage(admin, b.imageId, { reason: "duplicate" });
  });

  it("approving publishes the files, records the visit, forgets the capture point and replaces the placeholder", async () => {
    const { imageId, keys } = await pendingPhoto();
    const res = await approveImage(admin, imageId, { makeHero: false });
    expect(res.status).toBe("approved");

    const [row] = await admin.db.select().from(placeImages).where(eq(placeImages.id, imageId));
    expect(row).toMatchObject({
      status: "approved",
      captureLat: null,
      captureLng: null,
      moderatedBy: adminId,
    });
    expect(row!.variants.webp[800]).toMatch(/^places\//);
    for (const k of keys) {
      expect(await exists("public", publicKeyFor(k))).toBe(true);
      expect(await exists("private", k)).toBe(false);
    }
    const [visit] = await admin.db
      .select()
      .from(visits)
      .where(and(eq(visits.userId, visitorId), eq(visits.placeId, placeId)));
    expect(visit).toBeTruthy();

    // It was the place's first real photo: it becomes the hero and the placeholder is retired.
    const [p] = await admin.db.select().from(places).where(eq(places.id, placeId));
    expect(p!.heroImageId).toBe(imageId);
    const placeholders = await admin.db
      .select()
      .from(placeImages)
      .where(and(eq(placeImages.placeId, placeId), eq(placeImages.attribution, PLACEHOLDER_ATTRIBUTION)));
    expect(placeholders).toHaveLength(0);

    await expect(approveImage(admin, imageId, { makeHero: false })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("a second approval keeps the hero unless asked", async () => {
    const [before] = await admin.db.select().from(places).where(eq(places.id, placeId));
    const second = await pendingPhoto("#558");
    await approveImage(admin, second.imageId, { makeHero: false });
    let [p] = await admin.db.select().from(places).where(eq(places.id, placeId));
    expect(p!.heroImageId).toBe(before!.heroImageId);
    const third = await pendingPhoto("#855");
    await approveImage(admin, third.imageId, { makeHero: true });
    [p] = await admin.db.select().from(places).where(eq(places.id, placeId));
    expect(p!.heroImageId).toBe(third.imageId);
  });

  it("rejecting deletes the files and capture point; the visitor sees the reason and note", async () => {
    const { imageId, keys } = await pendingPhoto();
    await rejectImage(admin, imageId, { reason: "people_privacy", note: "Faces in the foreground" });
    const [row] = await admin.db.select().from(placeImages).where(eq(placeImages.id, imageId));
    expect(row).toMatchObject({
      status: "rejected",
      rejectionReason: "people_privacy",
      rejectionNote: "Faces in the foreground",
      captureLat: null,
    });
    for (const k of keys) expect(await exists("private", k)).toBe(false);
    const mine = (await listMyUploads(visitor)).find((u) => u.id === imageId)!;
    expect(mine).toMatchObject({
      rejectionReason: "people_privacy",
      rejectionNote: "Faces in the foreground",
      thumbUrl: null,
    });
    const decided = await listModerationQueue(admin, { status: "rejected", limit: 50 });
    expect(decided.items.find((i) => i.id === imageId)?.capturePoint).toBeNull();
  });
});

describe.runIf(Boolean(url))("place admin (integration)", () => {
  it("creates, updates and deletes a place with its photos and files", async () => {
    const slug = `adm-${randomUUID().slice(0, 8)}`;
    await expect(createPlace(visitor, baseInput(slug))).rejects.toMatchObject({ code: "FORBIDDEN" });
    const { id } = await createPlace(admin, baseInput(slug));
    await expect(createPlace(admin, baseInput(slug))).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      createPlace(admin, { ...baseInput(`${slug}-x`), location: { lat: 51.5, lng: -0.1 } }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });

    const renamed = `${slug}-r`;
    const saved = await updatePlace(admin, id, {
      ...baseInput(renamed),
      district: "galle",
      status: "published",
      feeForeignLkr: 500,
    });
    expect(saved).toEqual({ id, slug: renamed, previousSlug: slug });
    const place = await getAdminPlace(admin, id);
    expect(place).toMatchObject({ province: "southern", status: "published", feeForeignLkr: 500 });
    expect((await listAdminPlaces(admin, { q: renamed })).items.map((p) => p.id)).toEqual([id]);

    const first = await addOfficialImage(admin, id, await photo("#246"), {
      alt: "First",
      attribution: "Test",
      license: "CC0",
      sourceUrl: null,
      makeHero: false,
    });
    expect(first.image.isHero).toBe(true); // no hero yet → becomes the hero
    const second = await addOfficialImage(admin, id, await photo("#642"), {
      alt: "Second",
      attribution: "Test",
      license: null,
      sourceUrl: null,
      makeHero: false,
    });
    expect(second.image.isHero).toBe(false);
    await setHeroImage(admin, id, second.image.id);
    await deleteImage(admin, second.image.id);
    expect((await getAdminPlace(admin, id)).heroImageId).toBe(first.image.id);

    const [img] = await admin.db.select().from(placeImages).where(eq(placeImages.id, first.image.id));
    const keys = variantKeys(img!.variants);
    expect(await exists("public", keys[0]!)).toBe(true);
    await deletePlace(admin, id);
    for (const k of keys) expect(await exists("public", k)).toBe(false);
    await expect(getAdminPlace(admin, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuses files that aren't images", async () => {
    await expect(
      addOfficialImage(admin, placeId, Buffer.from("definitely not an image"), {
        alt: "Nope",
        attribution: "Test",
        license: null,
        sourceUrl: null,
        makeHero: false,
      }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA" });
  });
});
