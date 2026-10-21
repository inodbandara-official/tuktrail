import { apiHandler } from "@/server/next/api";
import { checkHealth } from "@/server/services/health";

export const GET = apiHandler(async ({ ctx }) => checkHealth(ctx), { noStore: true });
