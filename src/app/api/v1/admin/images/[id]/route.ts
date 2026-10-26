import { z } from "zod";
import { apiHandler } from "@/server/next/api";
import { revalidatePlace } from "@/server/next/revalidate";
import { deleteImage } from "@/server/services/admin-places";

export const DELETE = apiHandler<{ id: string }>(
  async ({ ctx, params }) => {
    const { placeSlug } = await deleteImage(ctx, z.uuid().parse(params.id));
    revalidatePlace(placeSlug);
    return new Response(null, { status: 204 });
  },
  { auth: "admin" },
);
