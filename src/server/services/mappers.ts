import {
  IMAGE_FORMATS,
  IMAGE_WIDTHS,
  REJECTION_REASONS,
  type RejectionReason,
} from "@/shared/constants/places";
import type { PlaceImage, PlaceSummary } from "@/shared/schemas/place";
import type { placeImages, places } from "../db/schema";
import type { Storage } from "../storage/storage";

type PlaceRow = typeof places.$inferSelect;
type ImageRow = typeof placeImages.$inferSelect;

/** Public image DTO. Never includes capture coordinates, uploader or moderation fields. */
export function toImageDto(row: ImageRow, storage: Storage): PlaceImage {
  const sources = IMAGE_FORMATS.flatMap((format) =>
    IMAGE_WIDTHS.filter((w) => w <= Math.max(row.width, IMAGE_WIDTHS[0])).map((width) => ({
      format,
      width,
      url: storage.publicUrl(row.variants[format][width]),
    })),
  );
  return {
    id: row.id,
    alt: row.altText,
    width: row.width,
    height: row.height,
    lqip: row.lqip,
    sources,
    source: row.source,
    attribution: row.attribution,
    license: row.license,
    sourceUrl: row.sourceUrl,
    licenseUrl: row.licenseUrl,
  };
}

export function toPlaceSummary(
  row: PlaceRow,
  hero: ImageRow | null,
  storage: Storage,
  distanceM?: number,
): PlaceSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    location: row.location,
    district: row.district,
    province: row.province,
    shortDescription: row.shortDescription,
    bestMonths: row.bestMonths,
    isVerified: row.isVerified,
    heroImage: hero && hero.status === "approved" ? toImageDto(hero, storage) : null,
    ...(distanceM === undefined ? {} : { distanceM: Math.round(distanceM) }),
  };
}

/** Stored rejection reason → known code (older free-text values map to "other"). */
export function asRejectionReason(v: string | null): RejectionReason | null {
  if (v === null) return null;
  return (REJECTION_REASONS as readonly string[]).includes(v) ? (v as RejectionReason) : "other";
}
