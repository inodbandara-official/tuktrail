import { z } from "zod";
import { apiHandler } from "@/server/next/api";
import { revalidatePlace } from "@/server/next/revalidate";
import { setHeroImage } from "@/server/services/admin-places";
import { setHeroSchema } from "@/shared/schemas/admin";

export const POST = apiHandler<{ id: string }>(
  async ({ req, ctx, params }) => {
    const { imageId } = setHeroSchema.parse(await req.json());
    const { placeSlug } = await setHeroImage(ctx, z.uuid().parse(params.id), imageId);
    revalidatePlace(placeSlug);
    return { ok: true };
  },
  { auth: "admin" },
);
