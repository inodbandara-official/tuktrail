import { apiHandler, searchParamsToObject } from "@/server/next/api";
import { revalidatePlace } from "@/server/next/revalidate";
import { createPlace, listAdminPlaces } from "@/server/services/admin-places";
import { adminPlaceQuerySchema } from "@/shared/schemas/admin";
import { placeInputSchema } from "@/shared/schemas/place";

export const GET = apiHandler(
  async ({ req, ctx }) =>
    listAdminPlaces(ctx, adminPlaceQuerySchema.parse(searchParamsToObject(req.nextUrl.searchParams))),
  { auth: "admin" },
);

export const POST = apiHandler(
  async ({ req, ctx }) => {
    const saved = await createPlace(ctx, placeInputSchema.parse(await req.json()));
    revalidatePlace(saved.slug);
    return Response.json(saved, { status: 201, headers: { "Cache-Control": "no-store, private" } });
  },
  { auth: "admin" },
);
