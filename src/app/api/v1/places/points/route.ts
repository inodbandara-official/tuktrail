import { apiHandler, searchParamsToObject } from "@/server/next/api";
import { findMapPoints } from "@/server/services/nearby";
import { mapPointsQuerySchema } from "@/shared/schemas/nearby";

// Lightweight markers for the map; same filters as /places/nearby, no pagination.
export const GET = apiHandler(
  async ({ req, ctx }) => ({
    items: await findMapPoints(
      ctx,
      mapPointsQuerySchema.parse(searchParamsToObject(req.nextUrl.searchParams)),
    ),
  }),
  { noStore: true },
);
