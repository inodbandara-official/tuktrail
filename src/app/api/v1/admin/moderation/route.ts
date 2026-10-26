import { apiHandler, searchParamsToObject } from "@/server/next/api";
import { listModerationQueue } from "@/server/services/moderation";
import { moderationQuerySchema } from "@/shared/schemas/admin";

// Admin-only: includes uploader emails and capture points of photos awaiting review.
export const GET = apiHandler(
  async ({ req, ctx }) =>
    listModerationQueue(ctx, moderationQuerySchema.parse(searchParamsToObject(req.nextUrl.searchParams))),
  { auth: "admin" },
);
