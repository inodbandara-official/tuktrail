import { z } from "zod";
import { DISTRICTS, PROVINCES } from "../constants/geography";
import {
  IMAGE_FORMATS,
  IMAGE_SOURCES,
  PLACE_CATEGORIES,
  PLACE_STATUSES,
  SHORT_DESCRIPTION_MAX,
} from "../constants/places";
import { latLngSchema, monthSchema, slugSchema } from "./common";

export const placeCategorySchema = z.enum(PLACE_CATEGORIES);
export const placeStatusSchema = z.enum(PLACE_STATUSES);
export const districtSchema = z.enum(DISTRICTS);
export const provinceSchema = z.enum(PROVINCES);

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Use 24h HH:MM" });

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** Weekly schedule. A missing day means "unknown", an empty array means "closed". */
export const openingHoursSchema = z.object({
  weekly: z.partialRecord(z.enum(WEEKDAYS), z.array(z.object({ open: timeOfDay, close: timeOfDay })).max(4)),
  notes: z.string().max(500).optional(),
});
export type OpeningHours = z.infer<typeof openingHoursSchema>;

export const bestMonthsSchema = z
  .array(monthSchema)
  .max(12)
  .transform((months) => [...new Set(months)].sort((a, b) => a - b));

/** Admin create/update payload. Factual fields are nullable on purpose: never guess them. */
export const placeInputSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(120),
  category: placeCategorySchema,
  location: latLngSchema,
  visitRadiusM: z.int().min(50).max(50_000),
  district: districtSchema,
  shortDescription: z.string().trim().min(20).max(SHORT_DESCRIPTION_MAX),
  fullDescription: z.string().trim().max(20_000),
  openingHours: openingHoursSchema.nullable(),
  feeForeignLkr: z.int().min(0).nullable(),
  feeLocalLkr: z.int().min(0).nullable(),
  dressCode: z.string().trim().max(1000).nullable(),
  howToGetThere: z.string().trim().max(2000).nullable(),
  bestMonths: bestMonthsSchema,
  safetyNotes: z.string().trim().max(2000).nullable(),
  isVerified: z.boolean(),
  status: placeStatusSchema,
});
export type PlaceInput = z.infer<typeof placeInputSchema>;

// ── Response DTOs (shared with future mobile client) ──────────────────

export const imageSourceItemSchema = z.object({
  format: z.enum(IMAGE_FORMATS),
  width: z.int(),
  url: z.url(),
});

export const placeImageSchema = z.object({
  id: z.uuid(),
  alt: z.string(),
  width: z.int(),
  height: z.int(),
  /** Tiny blurred preview as a data URI, shown while the real image loads. */
  lqip: z.string(),
  sources: z.array(imageSourceItemSchema),
  source: z.enum(IMAGE_SOURCES),
  attribution: z.string().nullable(),
  license: z.string().nullable(),
});
export type PlaceImage = z.infer<typeof placeImageSchema>;

export const placeSummarySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  category: placeCategorySchema,
  location: latLngSchema,
  district: districtSchema,
  province: provinceSchema,
  shortDescription: z.string(),
  bestMonths: z.array(z.int()),
  isVerified: z.boolean(),
  heroImage: placeImageSchema.nullable(),
  /** Metres from the requested origin; present on nearby results only. */
  distanceM: z.int().optional(),
});
export type PlaceSummary = z.infer<typeof placeSummarySchema>;

export const placeDetailSchema = placeSummarySchema.extend({
  fullDescription: z.string(),
  visitRadiusM: z.int(),
  openingHours: openingHoursSchema.nullable(),
  feeForeignLkr: z.int().nullable(),
  feeLocalLkr: z.int().nullable(),
  dressCode: z.string().nullable(),
  howToGetThere: z.string().nullable(),
  safetyNotes: z.string().nullable(),
  images: z.array(placeImageSchema),
  updatedAt: z.iso.datetime(),
});
export type PlaceDetail = z.infer<typeof placeDetailSchema>;
