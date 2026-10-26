import { z } from "zod";
import { apiHandler } from "@/server/next/api";
import { revalidatePlace } from "@/server/next/revalidate";
import { addOfficialImage } from "@/server/services/admin-places";
import { AppError } from "@/server/services/errors";
import { officialImageMetaSchema } from "@/shared/schemas/admin";

/** multipart/form-data: `file` plus alt, attribution, license, sourceUrl, makeHero. */
export const POST = apiHandler<{ id: string }>(
  async ({ req, ctx, params }) => {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!form || !(file instanceof File)) throw new AppError("BAD_REQUEST", "Choose a photo to upload.");
    const meta = officialImageMetaSchema.parse({
      alt: form.get("alt") ?? "",
      attribution: form.get("attribution") ?? "",
      license: form.get("license") ?? "",
      sourceUrl: form.get("sourceUrl") ?? "",
      makeHero: form.get("makeHero") ?? false,
    });
    const result = await addOfficialImage(
      ctx,
      z.uuid().parse(params.id),
      Buffer.from(await file.arrayBuffer()),
      meta,
    );
    revalidatePlace(result.placeSlug);
    return Response.json(result.image, { status: 201, headers: { "Cache-Control": "no-store, private" } });
  },
  { auth: "admin" },
);
