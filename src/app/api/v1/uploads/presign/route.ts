import { apiHandler } from "@/server/next/api";
import { uploadLimits } from "@/server/next/limits";
import { presignUploads } from "@/server/services/uploads";
import { presignRequestSchema } from "@/shared/schemas/uploads";

export const POST = apiHandler(
  async ({ req, ctx }) => presignUploads(ctx, presignRequestSchema.parse(await req.json()), uploadLimits()),
  { auth: "user" },
);
