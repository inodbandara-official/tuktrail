import { createHash } from "node:crypto";
import { AppError } from "./errors";

/**
 * Keyset cursor for distance-ordered results: (distance, id) of the last item, bound to a
 * fingerprint of the query (origin + filters) so a cursor can't be replayed against another query.
 */
export interface DistanceCursor {
  d: number;
  id: string;
}

export function queryFingerprint(parts: unknown): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("base64url").slice(0, 12);
}

export function encodeCursor(c: DistanceCursor, fingerprint: string): string {
  return Buffer.from(JSON.stringify([c.d, c.id, fingerprint])).toString("base64url");
}

export function decodeCursor(raw: string, fingerprint: string): DistanceCursor {
  try {
    const [d, id, fp] = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as [
      unknown,
      unknown,
      unknown,
    ];
    if (typeof d !== "number" || !Number.isFinite(d) || typeof id !== "string" || fp !== fingerprint) {
      throw new Error("mismatch");
    }
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("bad id");
    return { d, id };
  } catch {
    throw new AppError("BAD_REQUEST", "Invalid or expired cursor. Restart from the first page.");
  }
}
