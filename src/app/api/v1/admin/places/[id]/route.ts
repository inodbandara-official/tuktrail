import { z } from "zod";
import { apiHandler } from "@/server/next/api";
import { revalidatePlace } from "@/server/next/revalidate";
import { deletePlace, getAdminPlace, updatePlace } from "@/server/services/admin-places";
import { placeInputSchema } from "@/shared/schemas/place";

export const GET = apiHandler<{ id: string }>(
  async ({ ctx, params }) => getAdminPlace(ctx, z.uuid().parse(params.id)),
  { auth: "admin" },
);

/** Full replacement of the editable fields (the admin form always sends all of them). */
export const PUT = apiHandler<{ id: string }>(
  async ({ req, ctx, params }) => {
    const saved = await updatePlace(ctx, z.uuid().parse(params.id), placeInputSchema.parse(await req.json()));
    revalidatePlace(saved.slug, saved.previousSlug);
    return { id: saved.id, slug: saved.slug };
  },
  { auth: "admin" },
);

export const DELETE = apiHandler<{ id: string }>(
  async ({ ctx, params }) => {
    const { slug } = await deletePlace(ctx, z.uuid().parse(params.id));
    revalidatePlace(slug);
    return new Response(null, { status: 204 });
  },
  { auth: "admin" },
);
