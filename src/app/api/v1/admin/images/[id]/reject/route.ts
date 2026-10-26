import { z } from "zod";
import { apiHandler } from "@/server/next/api";
import { rejectImage } from "@/server/services/moderation";
import { rejectRequestSchema } from "@/shared/schemas/admin";

export const POST = apiHandler<{ id: string }>(
  async ({ req, ctx, params }) =>
    rejectImage(ctx, z.uuid().parse(params.id), rejectRequestSchema.parse(await req.json())),
  { auth: "admin" },
);
