import { apiHandler } from "@/server/next/api";
import { AppError } from "@/server/services/errors";
import { getPlaceDetail } from "@/server/services/places";
import { slugSchema } from "@/shared/schemas/common";

export const GET = apiHandler<{ slug: string }>(async ({ ctx, params }) => {
  const place = await getPlaceDetail(ctx, slugSchema.parse(params.slug));
  if (!place) throw new AppError("NOT_FOUND", "Place not found");
  return place;
});
