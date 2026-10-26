import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, gt, ilike, ne, or, sql } from "drizzle-orm";
import sharp from "sharp";
import { provinceOf, SRI_LANKA_BOUNDS } from "@/shared/constants/geography";
import { PLACEHOLDER_ATTRIBUTION } from "@/shared/constants/places";
import type {
  AdminImage,
  AdminPlace,
  AdminPlaceListItem,
  AdminPlaceQuery,
  AdminStats,
  OfficialImageMeta,
} from "@/shared/schemas/admin";
import type { PlaceInput } from "@/shared/schemas/place";
import { UPLOAD_MAX_BYTES } from "@/shared/schemas/uploads";
import { placeImages, places, type ImageVariants } from "../db/schema";
import { IMMUTABLE_CACHE, processImage } from "../lib/images";
import type { Ctx } from "./context";
import { AppError } from "./errors";
import { countPending, requireAdmin, variantKeys } from "./moderation";

const PREVIEW_TTL_S = 60 * 60;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

type ImageRow = typeof placeImages.$inferSelect;

/** Files of an image, in whichever bucket its status keeps them. */
function storedFiles(img: Pick<ImageRow, "status" | "variants">) {
  if (img.status === "rejected") return null;
  return {
    bucket: img.status === "approved" ? ("public" as const) : ("private" as const),
    keys: variantKeys(img.variants),
  };
}

async function thumbFor(ctx: Ctx, img: Pick<ImageRow, "status" | "variants">) {
  const key = img.variants.webp[400];
  if (img.status === "approved") return ctx.storage.publicUrl(key);
  if (img.status === "pending") return ctx.storage.presignGet("private", key, PREVIEW_TTL_S);
  return null;
}

function checkInput(input: PlaceInput) {
  const { lat, lng } = input.location;
  const b = SRI_LANKA_BOUNDS;
  if (lat < b.south || lat > b.north || lng < b.west || lng > b.east) {
    throw new AppError("VALIDATION_FAILED", "That location is outside Sri Lanka.", {
      fieldErrors: { location: ["Outside Sri Lanka"] },
    });
  }
}

async function assertSlugFree(ctx: Ctx, slug: string, exceptId?: string) {
  const [taken] = await ctx.db
    .select({ id: places.id })
    .from(places)
    .where(and(eq(places.slug, slug), exceptId ? ne(places.id, exceptId) : undefined))
    .limit(1);
  if (taken) {
    throw new AppError("CONFLICT", "Another place already uses that web address.", {
      fieldErrors: { slug: ["Already in use"] },
    });
  }
}

function toColumns(input: PlaceInput) {
  return {
    slug: input.slug,
    name: input.name,
    category: input.category,
    location: input.location,
    visitRadiusM: input.visitRadiusM,
    district: input.district,
    province: provinceOf(input.district),
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    openingHours: input.openingHours,
    feeForeignLkr: input.feeForeignLkr,
    feeLocalLkr: input.feeLocalLkr,
    dressCode: input.dressCode || null,
    howToGetThere: input.howToGetThere || null,
    bestMonths: input.bestMonths,
    safetyNotes: input.safetyNotes || null,
    isVerified: input.isVerified,
    status: input.status,
  };
}

async function placeCounts(ctx: Ctx) {
  const [row] = await ctx.db
    .select({
      total: count(),
      published: sql<number>`count(*) filter (where ${places.status} = 'published')::int`,
      draft: sql<number>`count(*) filter (where ${places.status} = 'draft')::int`,
      unverified: sql<number>`count(*) filter (where not ${places.isVerified})::int`,
    })
    .from(places);
  return {
    total: row?.total ?? 0,
    published: row?.published ?? 0,
    draft: row?.draft ?? 0,
    unverified: row?.unverified ?? 0,
  };
}

export async function getAdminStats(ctx: Ctx): Promise<AdminStats> {
  requireAdmin(ctx);
  const weekAgo = new Date(ctx.now().getTime() - 7 * 24 * 60 * 60 * 1000);
  const [decided] = await ctx.db
    .select({ n: count() })
    .from(placeImages)
    .where(and(eq(placeImages.source, "user"), gt(placeImages.moderatedAt, weekAgo)));
  return {
    pendingPhotos: await countPending(ctx),
    places: await placeCounts(ctx),
    decidedThisWeek: decided?.n ?? 0,
  };
}

/** All places (drafts included), alphabetical, optionally filtered by name/slug and status. */
export async function listAdminPlaces(
  ctx: Ctx,
  query: AdminPlaceQuery,
): Promise<{ items: AdminPlaceListItem[]; counts: Awaited<ReturnType<typeof placeCounts>> }> {
  requireAdmin(ctx);
  const q = query.q?.trim();
  const pending = sql<number>`(select count(*)::int from place_images p where p.place_id = ${places.id} and p.status = 'pending')`;
  const rows = await ctx.db
    .select({ place: places, hero: placeImages, pending })
    .from(places)
    .leftJoin(placeImages, eq(placeImages.id, places.heroImageId))
    .where(
      and(
        q ? or(ilike(places.name, `%${q}%`), ilike(places.slug, `%${q}%`)) : undefined,
        query.status ? eq(places.status, query.status) : undefined,
        query.unverified ? eq(places.isVerified, false) : undefined,
      ),
    )
    .orderBy(asc(places.name))
    .limit(500);
  return {
    items: await Promise.all(
      rows.map(async ({ place, hero, pending: n }) => ({
        id: place.id,
        slug: place.slug,
        name: place.name,
        category: place.category,
        district: place.district,
        status: place.status,
        isVerified: place.isVerified,
        thumbUrl: hero ? await thumbFor(ctx, hero) : null,
        pendingPhotos: Number(n),
        updatedAt: place.updatedAt.toISOString(),
      })),
    ),
    counts: await placeCounts(ctx),
  };
}

export async function getAdminPlace(ctx: Ctx, id: string): Promise<AdminPlace> {
  requireAdmin(ctx);
  const [place] = await ctx.db.select().from(places).where(eq(places.id, id)).limit(1);
  if (!place) throw new AppError("NOT_FOUND", "Place not found");
  const images = await ctx.db
    .select()
    .from(placeImages)
    .where(and(eq(placeImages.placeId, id), ne(placeImages.status, "rejected")))
    .orderBy(desc(placeImages.createdAt));
  // Main photo first.
  images.sort((a, b) => Number(b.id === place.heroImageId) - Number(a.id === place.heroImageId));

  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    category: place.category,
    location: place.location,
    visitRadiusM: place.visitRadiusM,
    district: place.district,
    province: place.province,
    shortDescription: place.shortDescription,
    fullDescription: place.fullDescription,
    openingHours: place.openingHours ?? null,
    feeForeignLkr: place.feeForeignLkr,
    feeLocalLkr: place.feeLocalLkr,
    dressCode: place.dressCode,
    howToGetThere: place.howToGetThere,
    bestMonths: place.bestMonths,
    safetyNotes: place.safetyNotes,
    isVerified: place.isVerified,
    status: place.status,
    heroImageId: place.heroImageId,
    images: await Promise.all(images.map((i) => toAdminImage(ctx, i, place.heroImageId))),
    createdAt: place.createdAt.toISOString(),
    updatedAt: place.updatedAt.toISOString(),
  };
}

async function toAdminImage(ctx: Ctx, i: ImageRow, heroId: string | null): Promise<AdminImage> {
  return {
    id: i.id,
    status: i.status,
    source: i.source,
    thumbUrl: await thumbFor(ctx, i),
    alt: i.altText,
    attribution: i.attribution,
    license: i.license,
    sourceUrl: i.sourceUrl,
    isHero: i.id === heroId,
    isPlaceholder: i.attribution === PLACEHOLDER_ATTRIBUTION,
    createdAt: i.createdAt.toISOString(),
  };
}

export async function createPlace(ctx: Ctx, input: PlaceInput): Promise<{ id: string; slug: string }> {
  requireAdmin(ctx);
  checkInput(input);
  await assertSlugFree(ctx, input.slug);
  const [row] = await ctx.db
    .insert(places)
    .values(toColumns(input))
    .returning({ id: places.id, slug: places.slug });
  return row!;
}

export async function updatePlace(
  ctx: Ctx,
  id: string,
  input: PlaceInput,
): Promise<{ id: string; slug: string; previousSlug: string }> {
  requireAdmin(ctx);
  checkInput(input);
  const [existing] = await ctx.db
    .select({ slug: places.slug })
    .from(places)
    .where(eq(places.id, id))
    .limit(1);
  if (!existing) throw new AppError("NOT_FOUND", "Place not found");
  await assertSlugFree(ctx, input.slug, id);
  await ctx.db.update(places).set(toColumns(input)).where(eq(places.id, id));
  return { id, slug: input.slug, previousSlug: existing.slug };
}

/** Deletes a place, its photos (rows cascade) and every stored file. */
export async function deletePlace(ctx: Ctx, id: string): Promise<{ slug: string }> {
  requireAdmin(ctx);
  const [place] = await ctx.db.select({ slug: places.slug }).from(places).where(eq(places.id, id)).limit(1);
  if (!place) throw new AppError("NOT_FOUND", "Place not found");
  const images = await ctx.db
    .select({ status: placeImages.status, variants: placeImages.variants })
    .from(placeImages)
    .where(eq(placeImages.placeId, id));
  await ctx.db.delete(places).where(eq(places.id, id));
  const pub = images.flatMap((i) => (storedFiles(i)?.bucket === "public" ? variantKeys(i.variants) : []));
  const priv = images.flatMap((i) => (storedFiles(i)?.bucket === "private" ? variantKeys(i.variants) : []));
  if (pub.length) await ctx.storage.remove("public", pub);
  if (priv.length) await ctx.storage.remove("private", priv);
  return { slug: place.slug };
}

/**
 * Official photo uploaded by an admin: same processing as visitor photos (real format check,
 * metadata stripped, AVIF/WebP sizes) but no visit check, published straight away.
 */
export async function addOfficialImage(
  ctx: Ctx,
  placeId: string,
  file: Buffer,
  meta: OfficialImageMeta,
): Promise<{ image: AdminImage; placeSlug: string }> {
  const actor = requireAdmin(ctx);
  const [place] = await ctx.db
    .select({ id: places.id, slug: places.slug, heroImageId: places.heroImageId })
    .from(places)
    .where(eq(places.id, placeId))
    .limit(1);
  if (!place) throw new AppError("NOT_FOUND", "Place not found");
  if (file.length > UPLOAD_MAX_BYTES)
    throw new AppError("PAYLOAD_TOO_LARGE", "Photos must be 10 MB or smaller.");
  const fmt = await sharp(file)
    .metadata()
    .then((m) => m.format)
    .catch(() => null);
  if (!fmt || !ALLOWED_FORMATS.has(fmt)) {
    throw new AppError("UNSUPPORTED_MEDIA", "Only JPEG, PNG and WebP photos are supported.");
  }

  const imageId = randomUUID();
  const out = await processImage(file, `places/${place.id}/${imageId}`);
  await Promise.all(
    out.files.map((f) => ctx.storage.put("public", f.key, f.body, f.contentType, IMMUTABLE_CACHE)),
  );
  try {
    const [row] = await ctx.db
      .insert(placeImages)
      .values({
        id: imageId,
        placeId: place.id,
        variants: out.variants,
        width: out.width,
        height: out.height,
        lqip: out.lqip,
        altText: meta.alt,
        source: "official",
        attribution: meta.attribution,
        license: meta.license,
        sourceUrl: meta.sourceUrl,
        uploadedBy: actor.id,
        status: "approved",
        moderatedBy: actor.id,
        moderatedAt: ctx.now(),
      })
      .returning();
    const heroId = meta.makeHero || !place.heroImageId ? imageId : place.heroImageId;
    if (heroId === imageId) await setHeroImage(ctx, place.id, imageId);
    return { image: await toAdminImage(ctx, row!, heroId), placeSlug: place.slug };
  } catch (err) {
    await ctx.storage.remove("public", variantKeys(out.variants)).catch(() => undefined);
    throw err;
  }
}

/** Make an approved photo the place's main image. Generated placeholders are retired. */
export async function setHeroImage(
  ctx: Ctx,
  placeId: string,
  imageId: string,
): Promise<{ placeSlug: string }> {
  requireAdmin(ctx);
  const [row] = await ctx.db
    .select({ status: placeImages.status, slug: places.slug })
    .from(placeImages)
    .innerJoin(places, eq(places.id, placeImages.placeId))
    .where(and(eq(placeImages.id, imageId), eq(placeImages.placeId, placeId)))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Photo not found");
  if (row.status !== "approved")
    throw new AppError("CONFLICT", "Only published photos can be the main photo.");
  await ctx.db.update(places).set({ heroImageId: imageId }).where(eq(places.id, placeId));
  const placeholders = await ctx.db
    .delete(placeImages)
    .where(
      and(
        eq(placeImages.placeId, placeId),
        eq(placeImages.attribution, PLACEHOLDER_ATTRIBUTION),
        ne(placeImages.id, imageId),
      ),
    )
    .returning({ variants: placeImages.variants });
  const keys = placeholders.flatMap((p) => variantKeys(p.variants as ImageVariants));
  if (keys.length) await ctx.storage.remove("public", keys);
  return { placeSlug: row.slug };
}

/** Delete any photo of a place. If it was the main photo, the newest remaining published one takes over. */
export async function deleteImage(ctx: Ctx, imageId: string): Promise<{ placeSlug: string }> {
  requireAdmin(ctx);
  const [row] = await ctx.db
    .select({
      image: placeImages,
      place: { id: places.id, slug: places.slug, heroImageId: places.heroImageId },
    })
    .from(placeImages)
    .innerJoin(places, eq(places.id, placeImages.placeId))
    .where(eq(placeImages.id, imageId))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Photo not found");

  await ctx.db.transaction(async (tx) => {
    await tx.delete(placeImages).where(eq(placeImages.id, imageId));
    if (row.place.heroImageId === imageId) {
      const [next] = await tx
        .select({ id: placeImages.id })
        .from(placeImages)
        .where(and(eq(placeImages.placeId, row.place.id), eq(placeImages.status, "approved")))
        .orderBy(sql`${placeImages.source} = 'official' desc`, desc(placeImages.createdAt))
        .limit(1);
      await tx
        .update(places)
        .set({ heroImageId: next?.id ?? null })
        .where(eq(places.id, row.place.id));
    }
  });
  const files = storedFiles(row.image);
  if (files) await ctx.storage.remove(files.bucket, files.keys);
  return { placeSlug: row.place.slug };
}
