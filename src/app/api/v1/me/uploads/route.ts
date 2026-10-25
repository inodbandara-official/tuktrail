import { apiHandler } from "@/server/next/api";
import { listMyUploads } from "@/server/services/uploads";

export const GET = apiHandler(async ({ ctx }) => ({ items: await listMyUploads(ctx) }), { auth: "user" });
