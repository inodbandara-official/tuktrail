import { apiHandler } from "@/server/next/api";
import { getTown } from "@/server/services/towns";
import { slugSchema } from "@/shared/schemas/common";

export const GET = apiHandler<{ slug: string }>(async ({ ctx, params }) =>
  getTown(ctx, slugSchema.parse(params.slug)),
);
