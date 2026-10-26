import { apiHandler } from "@/server/next/api";
import { getAdminStats } from "@/server/services/admin-places";

export const GET = apiHandler(async ({ ctx }) => getAdminStats(ctx), { auth: "admin" });
