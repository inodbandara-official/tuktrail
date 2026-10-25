import { toNextJsHandler } from "better-auth/next-js";
import { connection, type NextRequest } from "next/server";
import { getAuth } from "@/server/auth/auth";

// Better Auth owns everything under /api/auth (sign-in, callbacks, session).
async function handle(req: NextRequest) {
  await connection();
  const { GET, POST } = toNextJsHandler(getAuth());
  return req.method === "GET" ? GET(req) : POST(req);
}

export const GET = handle;
export const POST = handle;
