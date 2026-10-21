export const PLACE_CATEGORIES = [
  "temple",
  "heritage_site",
  "beach",
  "waterfall",
  "national_park",
  "wildlife",
  "viewpoint",
  "hike",
  "museum",
  "lake",
  "garden",
  "other",
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const PLACE_STATUSES = ["draft", "published"] as const;
export type PlaceStatus = (typeof PLACE_STATUSES)[number];

export const IMAGE_SOURCES = ["official", "user"] as const;
export type ImageSource = (typeof IMAGE_SOURCES)[number];

export const IMAGE_STATUSES = ["pending", "approved", "rejected"] as const;
export type ImageStatus = (typeof IMAGE_STATUSES)[number];

export const VERIFICATION_METHODS = ["device", "exif"] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Radius choices offered in the nearby filter, in kilometres. */
export const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number];
export const DEFAULT_RADIUS_KM: RadiusKm = 25;

export const DEFAULT_VISIT_RADIUS_M = 1000;
export const SHORT_DESCRIPTION_MAX = 280;

/** Responsive widths generated for every stored image. */
export const IMAGE_WIDTHS = [400, 800, 1600] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];
export const IMAGE_FORMATS = ["avif", "webp"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

export const UPLOAD_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type UploadContentType = (typeof UPLOAD_CONTENT_TYPES)[number];
