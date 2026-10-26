import { and, asc, count, desc, eq, gt, isNotNull, lt, or, sql } from "drizzle-orm";
import { PLACEHOLDER_ATTRIBUTION } from "@/shared/constants/places";
import type {
  ApproveRequest,
  ModerationItem,
  ModerationList,
  ModerationQuery,
  ModerationResult,
  RejectRequest,
} from "@/shared/schemas/admin";
import { placeImages, places, uploadSubmissions, user, visits, type ImageVariants } from "../db/schema";
import { IMMUTABLE_CACHE } from "../lib/images";
import type { Ctx } from "./context";
import { AppError } from "./errors";
import { asRejectionReason } from "./mappers";

const PREVIEW_TTL_S = 60 * 60;

/** Every service in the admin area checks the role itself, whatever the transport did. */
export function requireAdmin(ctx: Ctx) {
  if (!ctx.actor) throw new AppError("UNAUTHENTICATED", "Please sign in first.");
  if (ctx.actor.role !== "admin") throw new AppError("FORBIDDEN", "Admins only.");
  return ctx.actor;
}

export const variantKeys = (v: ImageVariants) => Object.values(v).flatMap((w) => Object.values(w));

/** pending/<place>/<image>-800.webp → places/<place>/<image>-800.webp */
export function publicKeyFor(pendingKey: string): string {
  if (!pendingKey.startsWith("pending/")) throw new Error(`Not a pending key: ${pendingKey}`);
  return `places/${pendingKey.slice("pending/".length)}`;
}

function mapVariants(v: ImageVariants, fn: (key: string) => string): ImageVariants {
  return Object.fromEntries(
    Object.entries(v).map(([format, widths]) => [
      format,
      Object.fromEntries(Object.entries(widths).map(([w, key]) => [w, fn(key)])),
    ]),
  ) as ImageVariants;
}

// Keyset cursor: "<iso timestamp>|<uuid>", base64url.
function encodeCursor(at: Date, id: string) {
  return Buffer.from(`${at.toISOString()}|${id}`).toString("base64url");
}
function decodeCursor(c: string | undefined): { at: Date; id: string } | null {
  if (!c) return null;
  const [iso, id] = Buffer.from(c, "base64url").toString().split("|");
  const at = new Date(iso ?? "");
  if (!id || Number.isNaN(at.getTime())) throw new AppError("BAD_REQUEST", "Invalid cursor");
  return { at, id };
}

export async function countPending(ctx: Ctx): Promise<number> {
  requireAdmin(ctx);
  const [row] = await ctx.db
    .select({ n: count() })
    .from(placeImages)
    .where(and(eq(placeImages.status, "pending"), eq(placeImages.source, "user")));
  return row?.n ?? 0;
}

/**
 * Visitor photos by status. Pending: oldest first (first in, first reviewed).
 * Approved / rejected: most recently decided first.
 */
export async function listModerationQueue(ctx: Ctx, query: ModerationQuery): Promise<ModerationList> {
  requireAdmin(ctx);
  const pending = query.status === "pending";
  // Postgres keeps microseconds but the cursor (a JS Date) only milliseconds: sort and compare
  // at millisecond precision, or a row would sort after its own cursor and repeat forever.
  const sortCol = sql<Date>`date_trunc('milliseconds', ${pending ? placeImages.createdAt : placeImages.moderatedAt})`;
  const cursor = decodeCursor(query.cursor);
  const hero = sql`(select attribution from place_images h where h.id = ${places.heroImageId})`;

  const rows = await ctx.db
    .select({
      image: placeImages,
      place: {
        id: places.id,
        slug: places.slug,
        name: places.name,
        category: places.category,
        location: places.location,
        visitRadiusM: places.visitRadiusM,
        heroAttribution: sql<string | null>`${hero}`,
      },
      uploader: { name: user.name, email: user.email },
      submission: {
        method: uploadSubmissions.verificationMethod,
        distanceM: uploadSubmissions.distanceM,
      },
    })
    .from(placeImages)
    .innerJoin(places, eq(places.id, placeImages.placeId))
    .leftJoin(user, eq(user.id, placeImages.uploadedBy))
    .leftJoin(uploadSubmissions, eq(uploadSubmissions.id, placeImages.submissionId))
    .where(
      and(
        eq(placeImages.status, query.status),
        eq(placeImages.source, "user"),
        pending ? undefined : isNotNull(placeImages.moderatedAt),
        cursor
          ? pending
            ? or(gt(sortCol, cursor.at), and(eq(sortCol, cursor.at), gt(placeImages.id, cursor.id)))
            : or(lt(sortCol, cursor.at), and(eq(sortCol, cursor.at), lt(placeImages.id, cursor.id)))
          : undefined,
      ),
    )
    .orderBy(pending ? asc(sortCol) : desc(sortCol), pending ? asc(placeImages.id) : desc(placeImages.id))
    .limit(query.limit + 1);

  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const lastAt = last ? (pending ? last.image.createdAt : last.image.moderatedAt) : null;

  const items: ModerationItem[] = await Promise.all(
    page.map(async ({ image, place, uploader, submission }) => ({
      id: image.id,
      status: image.status,
      caption: image.altText,
      previewUrl:
        image.status === "pending"
          ? await ctx.storage.presignGet("private", image.variants.webp[800], PREVIEW_TTL_S)
          : image.status === "approved"
            ? ctx.storage.publicUrl(image.variants.webp[800])
            : null,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt.toISOString(),
      place: {
        id: place.id,
        slug: place.slug,
        name: place.name,
        category: place.category,
        location: place.location,
        visitRadiusM: place.visitRadiusM,
        heroIsPlaceholder:
          place.heroAttribution === null || place.heroAttribution === PLACEHOLDER_ATTRIBUTION,
      },
      uploader: uploader?.email ? { name: uploader.name, email: uploader.email } : null,
      verification: submission?.method
        ? { method: submission.method, distanceM: submission.distanceM }
        : null,
      capturePoint:
        image.captureLat !== null && image.captureLng !== null
          ? { lat: image.captureLat, lng: image.captureLng }
          : null,
      rejectionReason: asRejectionReason(image.rejectionReason),
      rejectionNote: image.rejectionNote,
      moderatedAt: image.moderatedAt?.toISOString() ?? null,
    })),
  );

  return {
    items,
    nextCursor: rows.length > query.limit && last && lastAt ? encodeCursor(lastAt, last.image.id) : null,
    pendingCount: await countPending(ctx),
  };
}

async function lockPending(tx: Parameters<Parameters<Ctx["db"]["transaction"]>[0]>[0], imageId: string) {
  const [row] = await tx
    .select({
      id: placeImages.id,
      placeId: placeImages.placeId,
      status: placeImages.status,
      source: placeImages.source,
      variants: placeImages.variants,
      uploadedBy: placeImages.uploadedBy,
      placeSlug: places.slug,
      heroImageId: places.heroImageId,
    })
    .from(placeImages)
    .innerJoin(places, eq(places.id, placeImages.placeId))
    .where(eq(placeImages.id, imageId))
    .for("update", { of: placeImages })
    .limit(1);
  if (!row || row.source !== "user") throw new AppError("NOT_FOUND", "Photo not found");
  if (row.status !== "pending") throw new AppError("CONFLICT", "This photo has already been reviewed.");
  return row;
}

/**
 * Approve a visitor photo: copy its renditions to the public bucket, publish it, record the
 * uploader's verified visit, and forget where it was taken. It becomes the place's main photo
 * when asked to, or when the place only had a placeholder (which is then retired).
 */
export async function approveImage(
  ctx: Ctx,
  imageId: string,
  input: ApproveRequest,
): Promise<ModerationResult> {
  const actor = requireAdmin(ctx);
  const now = ctx.now();
  let copied: string[] = [];
  let privateKeys: string[] = [];
  const retired: string[] = [];

  try {
    const result = await ctx.db.transaction(async (tx) => {
      const row = await lockPending(tx, imageId);
      privateKeys = variantKeys(row.variants);
      const publicVariants = mapVariants(row.variants, publicKeyFor);
      for (const key of privateKeys) {
        const to = publicKeyFor(key);
        await ctx.storage.copy("private", key, "public", to, IMMUTABLE_CACHE);
        copied.push(to);
      }

      await tx
        .update(placeImages)
        .set({
          status: "approved",
          variants: publicVariants,
          moderatedBy: actor.id,
          moderatedAt: now,
          rejectionReason: null,
          rejectionNote: null,
          captureLat: null,
          captureLng: null,
        })
        .where(eq(placeImages.id, row.id));

      if (row.uploadedBy) {
        await tx
          .insert(visits)
          .values({ userId: row.uploadedBy, placeId: row.placeId, verifiedAt: now })
          .onConflictDoNothing();
      }

      const [hero] = row.heroImageId
        ? await tx
            .select({ attribution: placeImages.attribution })
            .from(placeImages)
            .where(eq(placeImages.id, row.heroImageId))
        : [];
      const onlyPlaceholder = !hero || hero.attribution === PLACEHOLDER_ATTRIBUTION;
      if (input.makeHero || onlyPlaceholder) {
        await tx.update(places).set({ heroImageId: row.id }).where(eq(places.id, row.placeId));
      }
      if (onlyPlaceholder) {
        const placeholders = await tx
          .delete(placeImages)
          .where(
            and(eq(placeImages.placeId, row.placeId), eq(placeImages.attribution, PLACEHOLDER_ATTRIBUTION)),
          )
          .returning({ variants: placeImages.variants });
        for (const p of placeholders) retired.push(...variantKeys(p.variants));
      }
      return { id: row.id, status: "approved" as const, placeSlug: row.placeSlug };
    });
    copied = [];
    await ctx.storage.remove("private", privateKeys);
    if (retired.length) await ctx.storage.remove("public", retired);
    return result;
  } finally {
    // Transaction failed after copying: don't leave orphaned public files behind.
    if (copied.length) await ctx.storage.remove("public", copied).catch(() => undefined);
  }
}

/** Reject a visitor photo: the uploader sees the reason; the files and capture point are deleted. */
export async function rejectImage(
  ctx: Ctx,
  imageId: string,
  input: RejectRequest,
): Promise<ModerationResult> {
  const actor = requireAdmin(ctx);
  const { result, keys } = await ctx.db.transaction(async (tx) => {
    const row = await lockPending(tx, imageId);
    await tx
      .update(placeImages)
      .set({
        status: "rejected",
        rejectionReason: input.reason,
        rejectionNote: input.note?.trim() || null,
        moderatedBy: actor.id,
        moderatedAt: ctx.now(),
        captureLat: null,
        captureLng: null,
      })
      .where(eq(placeImages.id, row.id));
    return {
      result: { id: row.id, status: "rejected" as const, placeSlug: row.placeSlug },
      keys: variantKeys(row.variants),
    };
  });
  await ctx.storage.remove("private", keys);
  return result;
}
