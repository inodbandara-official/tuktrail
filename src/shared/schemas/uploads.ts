import { z } from "zod";
import {
  IMAGE_STATUSES,
  REJECTION_REASONS,
  UPLOAD_CONTENT_TYPES,
  VERIFICATION_METHODS,
} from "../constants/places";
import { latitudeSchema, longitudeSchema } from "./common";

/** Defaults; the server can lower them via env (UPLOAD_MAX_FILES / UPLOAD_MAX_BYTES). */
export const UPLOAD_MAX_FILES = 5;
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const CAPTION_MAX = 200;

export const presignRequestSchema = z.object({
  placeId: z.uuid(),
  files: z
    .array(
      z.object({
        contentType: z.enum(UPLOAD_CONTENT_TYPES),
        size: z.int().min(1).max(UPLOAD_MAX_BYTES),
      }),
    )
    .min(1)
    .max(UPLOAD_MAX_FILES),
});
export type PresignRequest = z.infer<typeof presignRequestSchema>;

export const presignResponseSchema = z.object({
  uploads: z.array(
    z.object({
      intentId: z.uuid(),
      /** PUT the raw file here with exactly these headers. */
      uploadUrl: z.url(),
      headers: z.record(z.string(), z.string()),
      expiresAt: z.iso.datetime(),
    }),
  ),
});
export type PresignResponse = z.infer<typeof presignResponseSchema>;

/** Device position at upload time, used only to verify the visit. */
export const deviceLocationSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
  accuracyM: z.number().min(0).max(100_000).optional(),
});

export const submissionRequestSchema = z.object({
  placeId: z.uuid(),
  intentIds: z.array(z.uuid()).min(1).max(UPLOAD_MAX_FILES),
  device: deviceLocationSchema.nullish(),
  caption: z.string().trim().max(CAPTION_MAX).optional(),
});
export type SubmissionRequest = z.infer<typeof submissionRequestSchema>;

/** One of the signed-in user's own uploads (any status). URLs are short-lived for pending photos. */
export const myUploadSchema = z.object({
  id: z.uuid(),
  status: z.enum(IMAGE_STATUSES),
  rejectionReason: z.enum(REJECTION_REASONS).nullable(),
  /** The moderator's own words, if they added any. */
  rejectionNote: z.string().nullable(),
  caption: z.string(),
  /** Null once a rejected photo's files have been deleted. */
  thumbUrl: z.url().nullable(),
  createdAt: z.iso.datetime(),
  place: z.object({ slug: z.string(), name: z.string() }),
});
export type MyUpload = z.infer<typeof myUploadSchema>;

export const submissionResponseSchema = z.object({
  submissionId: z.uuid(),
  verification: z.object({ method: z.enum(VERIFICATION_METHODS), distanceM: z.int() }),
  images: z.array(myUploadSchema),
});
export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;

export const myUploadsResponseSchema = z.object({ items: z.array(myUploadSchema) });

/** `details` of a 422 OUTSIDE_VISIT_RADIUS error, for a friendly explanation. */
export const outsideRadiusDetailsSchema = z.object({
  placeName: z.string(),
  radiusM: z.int(),
  /** Closest evidence we had (device or any photo GPS), or null if there was none. */
  closestM: z.int().nullable(),
  /** 0-based indexes of photos without usable in-radius GPS. */
  failingFiles: z.array(z.int()),
  hadDeviceLocation: z.boolean(),
});
export type OutsideRadiusDetails = z.infer<typeof outsideRadiusDetailsSchema>;
