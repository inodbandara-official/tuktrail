import { z } from "zod";
import { apiHandler } from "@/server/next/api";
import { withdrawUpload } from "@/server/services/uploads";

export const DELETE = apiHandler<{ id: string }>(
  async ({ ctx, params }) => {
    await withdrawUpload(ctx, z.uuid().parse(params.id));
    return new Response(null, { status: 204 });
  },
  { auth: "user" },
);
