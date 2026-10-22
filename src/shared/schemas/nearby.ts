import { z } from "zod";
import { DEFAULT_RADIUS_KM, PLACE_CATEGORIES, RADIUS_OPTIONS_KM } from "../constants/places";
import { cursorSchema, latitudeSchema, longitudeSchema, monthSchema, paginated } from "./common";
import { districtSchema, placeCategorySchema, placeSummarySchema, provinceSchema } from "./place";

/** Coordinates are rounded to ~110 m before use: precise enough to sort by distance, never precise enough to track. */
export const roundCoord = (n: number) => Math.round(n * 1000) / 1000;

const csvOrArray = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => {
    if (v === undefined || v === "") return undefined;
    const arr = Array.isArray(v) ? v : String(v).split(",");
    return arr.map((s) => String(s).trim()).filter(Boolean);
  }, z.array(item).max(PLACE_CATEGORIES.length).optional());

/** Shared filter fields for list and map-point queries. */
const nearbyFilters = {
  lat: latitudeSchema.transform(roundCoord),
  lng: longitudeSchema.transform(roundCoord),
  radius_km: z.coerce
    .number()
    .refine((n) => (RADIUS_OPTIONS_KM as readonly number[]).includes(n), {
      error: `radius_km must be one of ${RADIUS_OPTIONS_KM.join(", ")}`,
    })
    .default(DEFAULT_RADIUS_KM),
  category: csvOrArray(placeCategorySchema),
  month: monthSchema.optional(),
  /** Free text on name and district. When present the search is island-wide (radius ignored). */
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((s) => (s ? s : undefined)),
};

export const nearbyQuerySchema = z.object({
  ...nearbyFilters,
  cursor: cursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
export type NearbyQueryInput = z.input<typeof nearbyQuerySchema>;

export const nearbyResponseSchema = paginated(placeSummarySchema.required({ distanceM: true })).extend({
  /** Total matches; only on the first page. */
  total: z.int().optional(),
});
export type NearbyResponse = z.infer<typeof nearbyResponseSchema>;

export const mapPointsQuerySchema = z.object(nearbyFilters);
export type MapPointsQuery = z.infer<typeof mapPointsQuerySchema>;

/** Lightweight marker data for the map (no descriptions or images). */
export const mapPointSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  category: placeCategorySchema,
  lat: z.number(),
  lng: z.number(),
});
export type MapPoint = z.infer<typeof mapPointSchema>;
export const mapPointsResponseSchema = z.object({ items: z.array(mapPointSchema) });

export const townSchema = z.object({
  slug: z.string(),
  name: z.string(),
  district: districtSchema,
  province: provinceSchema,
  lat: z.number(),
  lng: z.number(),
});
export type Town = z.infer<typeof townSchema>;
export const townsQuerySchema = z.object({ q: z.string().trim().max(60).optional() });
export const townsResponseSchema = z.object({ items: z.array(townSchema) });
