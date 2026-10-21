// Next.js-specific glue: builds a service Ctx for route handlers and server components.
// Services themselves stay framework-agnostic.
import { getDb } from "../db/client";
import { getStorage } from "../storage/storage";
import type { Actor, Ctx } from "../services/context";

export function createCtx(actor: Actor | null = null): Ctx {
  return { db: getDb(), storage: getStorage(), now: () => new Date(), actor };
}
