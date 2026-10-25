import { randomUUID } from "node:crypto";
import { and, count, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import exifr from "exifr";
import sharp from "sharp";
import type { LatLng } from "@/shared/schemas/common";
import type {
  MyUpload,
  OutsideRadiusDetails,
  PresignRequest,
  PresignResponse,
  SubmissionRequest,
  SubmissionResponse,
} from "@/shared/schemas/uploads";
import { placeImages, places, uploadIntents, uploadSubmissions, type ImageVariants } from "../db/schema";
import { processImage } from "../lib/images";
import type { Ctx } from "./context";
import { AppError } from "./errors";
import { verifyVisit } from "./verification";

export interface UploadLimits {
  maxFiles: number;
  maxBytes: number;
  submissionsPerDay: number;
}

const INTENT_TTL_S = 10 * 60;
const MAX_OPEN_INTENTS = 20;
const PREVIEW_TTL_S = 60 * 60;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

function requireActor(ctx: Ctx) {
  if (!ctx.actor) throw new AppError("UNAUTHENTICATED", "Please sign in first.");
  return ctx.actor;
}

async function getPublishedPlace(ctx: Ctx, placeId: string) {
  const [place] = await ctx.db
    .select({
      id: places.id,
      name: places.name,
      slug: places.slug,
      location: places.location,
      radiusM: places.visitRadiusM,
    })
    .from(places)
    .where(and(eq(places.id, placeId), eq(places.status, "published")))
    .limit(1);
  if (!place) throw new AppError("NOT_FOUND", "Place not found");
  return place;
}

/** Step 1: issue presigned PUT URLs into the private bucket, one intent per file. */
export async function presignUploads(
  ctx: Ctx,
  input: PresignRequest,
  limits: UploadLimits,
): Promise<PresignResponse> {
  const actor = requireActor(ctx);
  await getPublishedPlace(ctx, input.placeId);
  if (input.files.length > limits.maxFiles) {
    throw new AppError("VALIDATION_FAILED", `You can upload up to ${limits.maxFiles} photos at a time.`);
  }
  for (const f of input.files) {
    if (f.size > limits.maxBytes)
      throw new AppError("PAYLOAD_TOO_LARGE", "Each photo must be 10 MB or smaller.");
  }

  const now = ctx.now();
  const [open] = await ctx.db
    .select({ n: count() })
    .from(uploadIntents)
    .where(
      and(
        eq(uploadIntents.userId, actor.id),
        isNull(uploadIntents.consumedAt),
        gt(uploadIntents.expiresAt, now),
      ),
    );
  if ((open?.n ?? 0) + input.files.length > MAX_OPEN_INTENTS) {
    throw new AppError("RATE_LIMITED", "Too many uploads in progress. Finish or wait a few minutes.");
  }

  const expiresAt = new Date(now.getTime() + INTENT_TTL_S * 1000);
  const rows = input.files.map((f) => {
    const id = randomUUID();
    return {
      id,
      userId: actor.id,
      objectKey: `incoming/${actor.id}/${id}`,
      contentType: f.contentType,
      sizeBytes: f.size,
      expiresAt,
    };
  });
  await ctx.db.insert(uploadIntents).values(rows);

  return {
    uploads: await Promise.all(
      rows.map(async (r) => ({
        intentId: r.id,
        uploadUrl: await ctx.storage.presignPut(r.objectKey, r.contentType, r.sizeBytes, INTENT_TTL_S),
        headers: { "Content-Type": r.contentType },
        expiresAt: expiresAt.toISOString(),
      })),
    ),
  };
}

async function readGps(buf: Buffer): Promise<LatLng | null> {
  try {
    const gps = await exifr.gps(buf);
    if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
      return { lat: gps.latitude, lng: gps.longitude };
    }
  } catch {
    /* no or unreadable EXIF */
  }
  return null;
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/**
 * Step 2: verify the visit (device location OR every photo's EXIF GPS within the visit radius),
 * strip metadata, render sizes into the PRIVATE bucket, and queue for moderation.
 * Approved photos are copied to the public bucket in the moderation step.
 */
export async function submitUploads(
  ctx: Ctx,
  input: SubmissionRequest,
  limits: UploadLimits,
): Promise<SubmissionResponse> {
  const actor = requireActor(ctx);
  const place = await getPublishedPlace(ctx, input.placeId);
  const now = ctx.now();

  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [recent] = await ctx.db
    .select({ n: count() })
    .from(uploadSubmissions)
    .where(and(eq(uploadSubmissions.userId, actor.id), gt(uploadSubmissions.createdAt, since)));
  if ((recent?.n ?? 0) >= limits.submissionsPerDay) {
    throw new AppError(
      "RATE_LIMITED",
      `You can share photos ${limits.submissionsPerDay} times a day. Please try again tomorrow.`,
    );
  }

  const uniqueIds = [...new Set(input.intentIds)];
  const intents = await ctx.db
    .select()
    .from(uploadIntents)
    .where(and(inArray(uploadIntents.id, uniqueIds), eq(uploadIntents.userId, actor.id)));
  if (intents.length !== uniqueIds.length || intents.some((i) => i.consumedAt || i.expiresAt <= now)) {
    throw new AppError("BAD_REQUEST", "Some uploads have expired. Please choose your photos again.");
  }
  const ordered = uniqueIds.map((id) => intents.find((i) => i.id === id)!);

  // Fetch originals and check what actually arrived (size and real image format, not the claimed type).
  const originals: Buffer[] = [];
  for (const intent of ordered) {
    const size = await ctx.storage.size("private", intent.objectKey);
    if (size === null)
      throw new AppError("BAD_REQUEST", "A photo didn't finish uploading. Please try again.");
    if (size > limits.maxBytes || size > intent.sizeBytes) {
      throw new AppError("PAYLOAD_TOO_LARGE", "Each photo must be 10 MB or smaller.");
    }
    const buf = await ctx.storage.get("private", intent.objectKey);
    const meta = await sharp(buf)
      .metadata()
      .catch(() => null);
    if (!meta?.format || !ALLOWED_FORMATS.has(meta.format)) {
      throw new AppError("UNSUPPORTED_MEDIA", "Only JPEG, PNG and WebP photos are supported.");
    }
    originals.push(buf);
  }

  const exif = await Promise.all(originals.map(readGps));
  const check = verifyVisit({
    place: { ...place.location, radiusM: place.radiusM },
    device: input.device ?? null,
    exif,
  });
  if (!check.ok) {
    const details: OutsideRadiusDetails = {
      placeName: place.name,
      radiusM: place.radiusM,
      closestM: check.closestM,
      failingFiles: check.failingFiles,
      hadDeviceLocation: Boolean(input.device),
    };
    throw new AppError(
      "OUTSIDE_VISIT_RADIUS",
      "We couldn't confirm these photos were taken at this place.",
      details,
    );
  }

  const caption = input.caption?.trim() || `Visitor photo of ${place.name}`;
  const processed: { imageId: string; out: Awaited<ReturnType<typeof processImage>> }[] = [];
  for (const buf of originals) {
    const imageId = randomUUID();
    const out = await processImage(buf, `pending/${place.id}/${imageId}`);
    await Promise.all(out.files.map((f) => ctx.storage.put("private", f.key, f.body, f.contentType)));
    processed.push({ imageId, out });
  }

  const submissionId = randomUUID();
  await ctx.db.transaction(async (tx) => {
    await tx.insert(uploadSubmissions).values({
      id: submissionId,
      userId: actor.id,
      placeId: place.id,
      verificationMethod: check.method,
      distanceM: check.distanceM,
    });
    await tx.insert(placeImages).values(
      processed.map(({ imageId, out }) => ({
        id: imageId,
        placeId: place.id,
        submissionId,
        variants: out.variants,
        width: out.width,
        height: out.height,
        lqip: out.lqip,
        altText: caption,
        source: "user" as const,
        uploadedBy: actor.id,
        status: "pending" as const,
        // PRIVATE: kept only until moderation, then cleared.
        captureLat: round4(check.point.lat),
        captureLng: round4(check.point.lng),
      })),
    );
    await tx.update(uploadIntents).set({ consumedAt: now }).where(inArray(uploadIntents.id, uniqueIds));
  });
  await ctx.storage.remove(
    "private",
    ordered.map((i) => i.objectKey),
  );

  const mine = await listMyUploads(
    ctx,
    processed.map((p) => p.imageId),
  );
  return { submissionId, verification: { method: check.method, distanceM: check.distanceM }, images: mine };
}

/** Pending/rejected photos live in the private bucket; approved ones are public. */
async function thumbUrl(ctx: Ctx, status: string, variants: ImageVariants) {
  const key = variants.webp[400];
  return status === "approved"
    ? ctx.storage.publicUrl(key)
    : ctx.storage.presignGet("private", key, PREVIEW_TTL_S);
}

export async function listMyUploads(ctx: Ctx, onlyIds?: string[]): Promise<MyUpload[]> {
  const actor = requireActor(ctx);
  const rows = await ctx.db
    .select({ image: placeImages, place: { slug: places.slug, name: places.name } })
    .from(placeImages)
    .innerJoin(places, eq(places.id, placeImages.placeId))
    .where(and(eq(placeImages.uploadedBy, actor.id), onlyIds ? inArray(placeImages.id, onlyIds) : sql`true`))
    .orderBy(desc(placeImages.createdAt))
    .limit(200);
  return Promise.all(
    rows.map(async ({ image, place }) => ({
      id: image.id,
      status: image.status,
      rejectionReason: image.rejectionReason,
      caption: image.altText,
      thumbUrl: await thumbUrl(ctx, image.status, image.variants),
      createdAt: image.createdAt.toISOString(),
      place,
    })),
  );
}

/** Owners can withdraw a photo while it's still pending. */
export async function withdrawUpload(ctx: Ctx, imageId: string): Promise<void> {
  const actor = requireActor(ctx);
  const [row] = await ctx.db
    .select({ id: placeImages.id, status: placeImages.status, variants: placeImages.variants })
    .from(placeImages)
    .where(and(eq(placeImages.id, imageId), eq(placeImages.uploadedBy, actor.id)))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Photo not found");
  if (row.status !== "pending")
    throw new AppError("CONFLICT", "Only photos awaiting review can be withdrawn.");
  await ctx.db.delete(placeImages).where(eq(placeImages.id, row.id));
  await ctx.storage.remove(
    "private",
    Object.values(row.variants).flatMap((v) => Object.values(v)),
  );
}
