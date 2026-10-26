import { connection, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { ApiError } from "@/shared/schemas/common";
import { AppError } from "../services/errors";
import type { Ctx } from "../services/context";
import { createCtx } from "./ctx";
import { getSessionUser } from "./session";

type Handler<P> = (args: { req: NextRequest; ctx: Ctx; params: P }) => Promise<Response | unknown>;

interface Options {
  /** Responses that depend on a user's coordinates must never be cached by browsers or CDNs. */
  noStore?: boolean;
  /** Require a signed-in user ("user", else 401) or an admin ("admin", else 404). Responses are then private/no-store. */
  auth?: "user" | "admin";
}

function errorResponse(status: number, body: ApiError) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Wraps a /api/v1 route handler: request-time rendering, uniform JSON errors,
 * and no logging of query strings (they can contain coordinates).
 */
export function apiHandler<P = Record<string, never>>(handler: Handler<P>, opts: Options = {}) {
  return async (req: NextRequest, route: { params: Promise<P> }) => {
    await connection();
    try {
      const params = route?.params ? await route.params : ({} as P);
      let actor = null;
      if (opts.auth) {
        actor = await getSessionUser(req.headers);
        // The admin API answers 404 to everyone else, so it doesn't advertise itself.
        if (opts.auth === "admin" && actor?.role !== "admin") throw new AppError("NOT_FOUND", "Not found");
        if (!actor) throw new AppError("UNAUTHENTICATED", "Please sign in first.");
      }
      const result = await handler({
        req,
        ctx: createCtx(actor ? { id: actor.id, role: actor.role } : null),
        params,
      });
      if (result instanceof Response) return result;
      return NextResponse.json(result, {
        headers: opts.noStore || opts.auth ? { "Cache-Control": "no-store, private" } : undefined,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return errorResponse(422, {
          error: { code: "VALIDATION_FAILED", message: "Invalid request", details: z.flattenError(err) },
        });
      }
      if (err instanceof AppError) {
        return errorResponse(err.status, {
          error: { code: err.code, message: err.message, details: err.details },
        });
      }
      // Log method + path only, never the query string.
      console.error(`[api] ${req.method} ${req.nextUrl.pathname} failed:`, err);
      return errorResponse(500, { error: { code: "INTERNAL", message: "Something went wrong" } });
    }
  };
}

/** Parse URLSearchParams into a plain object (repeated keys become arrays) for Zod. */
export function searchParamsToObject(sp: URLSearchParams): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key);
    out[key] = all.length > 1 ? all : all[0]!;
  }
  return out;
}
