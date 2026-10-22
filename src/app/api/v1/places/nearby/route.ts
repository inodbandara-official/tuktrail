import { apiHandler, searchParamsToObject } from "@/server/next/api";
import { findNearby } from "@/server/services/nearby";
import { nearbyQuerySchema } from "@/shared/schemas/nearby";

// Coordinates arrive per request only; never stored, logged or cached (no-store).
export const GET = apiHandler(
  async ({ req, ctx }) =>
    findNearby(ctx, nearbyQuerySchema.parse(searchParamsToObject(req.nextUrl.searchParams))),
  { noStore: true },
);
