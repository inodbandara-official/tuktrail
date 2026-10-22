import { apiHandler, searchParamsToObject } from "@/server/next/api";
import { searchTowns } from "@/server/services/towns";
import { townsQuerySchema } from "@/shared/schemas/nearby";

export const GET = apiHandler(async ({ req, ctx }) => {
  const { q } = townsQuerySchema.parse(searchParamsToObject(req.nextUrl.searchParams));
  return { items: await searchTowns(ctx, q) };
});
