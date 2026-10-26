import { z } from "zod";
import { IMAGE_SOURCES, IMAGE_STATUSES, REJECTION_REASONS, VERIFICATION_METHODS } from "../constants/places";
import { latLngSchema } from "./common";
import {
  districtSchema,
  openingHoursSchema,
  placeCategorySchema,
  placeInputSchema,
  placeStatusSchema,
  provinceSchema,
} from "./place";

export const REJECTION_NOTE_MAX = 300;

// ── Moderation ────────────────────────────────────────────────────────

export const moderationStatusSchema = z.enum(IMAGE_STATUSES);

export const moderationQuerySchema = z.object({
  status: moderationStatusSchema.default("pending"),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export type ModerationQuery = z.infer<typeof moderationQuerySchema>;

/** One visitor photo in the moderation queue. Admin-only: includes uploader and capture point. */
export const moderationItemSchema = z.object({
  id: z.uuid(),
  status: moderationStatusSchema,
  caption: z.string(),
  /** Short-lived signed URL (pending) or public URL (approved); null once a rejected file is deleted. */
  previewUrl: z.url().nullable(),
  width: z.int(),
  height: z.int(),
  createdAt: z.iso.datetime(),
  place: z.object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    category: placeCategorySchema,
    location: latLngSchema,
    visitRadiusM: z.int(),
    heroIsPlaceholder: z.boolean(),
  }),
  uploader: z.object({ name: z.string(), email: z.string() }).nullable(),
  verification: z.object({ method: z.enum(VERIFICATION_METHODS), distanceM: z.int() }).nullable(),
  /** Where the photo was taken / sent from (4 dp). Cleared once moderated. */
  capturePoint: latLngSchema.nullable(),
  rejectionReason: z.enum(REJECTION_REASONS).nullable(),
  rejectionNote: z.string().nullable(),
  moderatedAt: z.iso.datetime().nullable(),
});
export type ModerationItem = z.infer<typeof moderationItemSchema>;

export const moderationListSchema = z.object({
  items: z.array(moderationItemSchema),
  nextCursor: z.string().nullable(),
  /** Photos waiting for review (whatever status is being listed). */
  pendingCount: z.int(),
});
export type ModerationList = z.infer<typeof moderationListSchema>;

export const approveRequestSchema = z.object({ makeHero: z.boolean().default(false) });
export type ApproveRequest = z.infer<typeof approveRequestSchema>;

export const rejectRequestSchema = z
  .object({
    reason: z.enum(REJECTION_REASONS),
    note: z.string().trim().max(REJECTION_NOTE_MAX).optional(),
  })
  .refine((r) => r.reason !== "other" || (r.note?.length ?? 0) >= 3, {
    error: "Please say why",
    path: ["note"],
  });
export type RejectRequest = z.infer<typeof rejectRequestSchema>;

export const moderationResultSchema = z.object({
  id: z.uuid(),
  status: moderationStatusSchema,
  placeSlug: z.string(),
});
export type ModerationResult = z.infer<typeof moderationResultSchema>;

// ── Places ────────────────────────────────────────────────────────────

export const adminPlaceQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: placeStatusSchema.optional(),
  unverified: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});
export type AdminPlaceQuery = z.infer<typeof adminPlaceQuerySchema>;

export const adminPlaceListItemSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  category: placeCategorySchema,
  district: districtSchema,
  status: placeStatusSchema,
  isVerified: z.boolean(),
  thumbUrl: z.url().nullable(),
  pendingPhotos: z.int(),
  updatedAt: z.iso.datetime(),
});
export type AdminPlaceListItem = z.infer<typeof adminPlaceListItemSchema>;

export const adminPlaceListSchema = z.object({
  items: z.array(adminPlaceListItemSchema),
  counts: z.object({ total: z.int(), published: z.int(), draft: z.int(), unverified: z.int() }),
});

export const adminImageSchema = z.object({
  id: z.uuid(),
  status: moderationStatusSchema,
  source: z.enum(IMAGE_SOURCES),
  thumbUrl: z.url().nullable(),
  alt: z.string(),
  attribution: z.string().nullable(),
  license: z.string().nullable(),
  sourceUrl: z.url().nullable(),
  isHero: z.boolean(),
  isPlaceholder: z.boolean(),
  createdAt: z.iso.datetime(),
});
export type AdminImage = z.infer<typeof adminImageSchema>;

export const adminPlaceSchema = placeInputSchema.extend({
  id: z.uuid(),
  province: provinceSchema,
  openingHours: openingHoursSchema.nullable(),
  heroImageId: z.uuid().nullable(),
  images: z.array(adminImageSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type AdminPlace = z.infer<typeof adminPlaceSchema>;

export const placeSavedSchema = z.object({ id: z.uuid(), slug: z.string() });

/** Form fields that accompany an official image upload (multipart). */
export const officialImageMetaSchema = z.object({
  alt: z.string().trim().min(3).max(200),
  attribution: z.string().trim().min(2).max(200),
  license: z
    .string()
    .trim()
    .max(100)
    .transform((s) => s || null)
    .nullable()
    .default(null),
  sourceUrl: z
    .union([z.url({ protocol: /^https?$/ }), z.literal("")])
    .transform((s) => s || null)
    .nullable()
    .default(null),
  makeHero: z
    .union([z.boolean(), z.enum(["true", "false", "on"])])
    .transform((v) => v === true || v === "true" || v === "on")
    .default(false),
});
export type OfficialImageMeta = z.infer<typeof officialImageMetaSchema>;

export const setHeroSchema = z.object({ imageId: z.uuid() });

export const adminStatsSchema = z.object({
  pendingPhotos: z.int(),
  places: z.object({ total: z.int(), published: z.int(), draft: z.int(), unverified: z.int() }),
  decidedThisWeek: z.int(),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;
