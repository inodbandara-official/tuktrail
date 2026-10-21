import { z } from "zod";

export const latitudeSchema = z.coerce.number().min(-90).max(90);
export const longitudeSchema = z.coerce.number().min(-180).max(180);

export const latLngSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
});
export type LatLng = z.infer<typeof latLngSchema>;

export const monthSchema = z.coerce.number().int().min(1).max(12);

export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Use lowercase letters, numbers and hyphens" });

/** Opaque pagination cursor. Clients must pass back exactly what the API returned. */
export const cursorSchema = z.string().max(512);

/** Uniform error body for every /api/v1 response with status >= 400. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export function paginated<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}
