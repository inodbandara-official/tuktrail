import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { DISTRICTS, PROVINCES } from "@/shared/constants/geography";
import {
  DEFAULT_VISIT_RADIUS_M,
  IMAGE_SOURCES,
  IMAGE_STATUSES,
  PLACE_CATEGORIES,
  PLACE_STATUSES,
  SHORT_DESCRIPTION_MAX,
  VERIFICATION_METHODS,
  type ImageFormat,
  type ImageWidth,
} from "@/shared/constants/places";
import type { OpeningHours } from "@/shared/schemas/place";
import { geographyPoint } from "../geography";
import { user } from "./auth";

export const placeCategory = pgEnum("place_category", PLACE_CATEGORIES);
export const placeStatus = pgEnum("place_status", PLACE_STATUSES);
export const district = pgEnum("district", DISTRICTS);
export const province = pgEnum("province", PROVINCES);
export const imageSource = pgEnum("image_source", IMAGE_SOURCES);
export const imageStatus = pgEnum("image_status", IMAGE_STATUSES);
export const verificationMethod = pgEnum("verification_method", VERIFICATION_METHODS);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const places = pgTable(
  "places",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull(),
    name: text().notNull(),
    category: placeCategory().notNull(),
    location: geographyPoint().notNull(),
    visitRadiusM: integer().notNull().default(DEFAULT_VISIT_RADIUS_M),
    district: district().notNull(),
    province: province().notNull(),
    shortDescription: varchar({ length: SHORT_DESCRIPTION_MAX }).notNull(),
    fullDescription: text().notNull().default(""),
    openingHours: jsonb().$type<OpeningHours>(),
    feeForeignLkr: integer(),
    feeLocalLkr: integer(),
    dressCode: text(),
    howToGetThere: text(),
    bestMonths: smallint()
      .array()
      .notNull()
      .default(sql`'{}'::smallint[]`),
    safetyNotes: text(),
    // No FK: avoids a places <-> place_images cycle. Validated in the service layer.
    heroImageId: uuid(),
    isVerified: boolean().notNull().default(false),
    status: placeStatus().notNull().default("draft"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex().on(t.slug),
    index("places_location_gist").using("gist", t.location),
    index("places_name_trgm").using("gin", sql`${t.name} gin_trgm_ops`),
    index().on(t.status, t.category),
    index("places_best_months_gin").using("gin", t.bestMonths),
    check("places_visit_radius_positive", sql`${t.visitRadiusM} > 0`),
    check("places_best_months_range", sql`${t.bestMonths} <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]`),
    check(
      "places_fees_non_negative",
      sql`coalesce(${t.feeForeignLkr}, 0) >= 0 and coalesce(${t.feeLocalLkr}, 0) >= 0`,
    ),
  ],
);

/** Storage keys per format and width, e.g. variants.webp[800] = "places/<id>/<img>-800.webp". */
export type ImageVariants = Record<ImageFormat, Record<ImageWidth, string>>;

export const uploadSubmissions = pgTable(
  "upload_submissions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    placeId: uuid()
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    verificationMethod: verificationMethod().notNull(),
    distanceM: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.userId, t.createdAt)],
);

export const uploadIntents = pgTable(
  "upload_intents",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    objectKey: text().notNull().unique(),
    contentType: text().notNull(),
    sizeBytes: integer().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    consumedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.userId), index().on(t.expiresAt)],
);

export const placeImages = pgTable(
  "place_images",
  {
    id: uuid().primaryKey().defaultRandom(),
    placeId: uuid()
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    submissionId: uuid().references(() => uploadSubmissions.id, { onDelete: "set null" }),
    variants: jsonb().$type<ImageVariants>().notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    lqip: text().notNull(),
    altText: text().notNull(),
    source: imageSource().notNull(),
    attribution: text(),
    license: text(),
    uploadedBy: text().references(() => user.id, { onDelete: "set null" }),
    status: imageStatus().notNull().default("pending"),
    rejectionReason: text(),
    // PRIVATE: where the photo was taken / uploaded from. Never exposed by any public DTO.
    // Cleared once an admin has moderated the image.
    captureLat: doublePrecision(),
    captureLng: doublePrecision(),
    moderatedBy: text().references(() => user.id, { onDelete: "set null" }),
    moderatedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.placeId, t.status), index().on(t.uploadedBy), index().on(t.status, t.createdAt)],
);

export const visits = pgTable(
  "visits",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    placeId: uuid()
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    verifiedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.placeId] })],
);

export const towns = pgTable(
  "towns",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    district: district().notNull(),
    province: province().notNull(),
    location: geographyPoint().notNull(),
    isHub: boolean().notNull().default(false),
  },
  (t) => [
    index("towns_location_gist").using("gist", t.location),
    index("towns_name_trgm").using("gin", sql`${t.name} gin_trgm_ops`),
  ],
);
