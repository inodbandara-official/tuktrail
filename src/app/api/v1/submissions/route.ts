import { apiHandler } from "@/server/next/api";
import { uploadLimits } from "@/server/next/limits";
import { submitUploads } from "@/server/services/uploads";
import { submissionRequestSchema } from "@/shared/schemas/uploads";

// Device coordinates arrive in the body (never the URL) and are used only for verification.
export const POST = apiHandler(
  async ({ req, ctx }) => submitUploads(ctx, submissionRequestSchema.parse(await req.json()), uploadLimits()),
  { auth: "user" },
);
