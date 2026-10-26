import { z } from "zod";
import { apiHandler } from "@/server/next/api";
import { revalidatePlace } from "@/server/next/revalidate";
import { approveImage } from "@/server/services/moderation";
import { approveRequestSchema } from "@/shared/schemas/admin";

export const POST = apiHandler<{ id: string }>(
  async ({ req, ctx, params }) => {
    const body = approveRequestSchema.parse(await req.json().catch(() => ({})));
    const result = await approveImage(ctx, z.uuid().parse(params.id), body);
    revalidatePlace(result.placeSlug);
    return result;
  },
  { auth: "admin" },
);
