import type { z } from "zod";
import { apiErrorSchema } from "@/shared/schemas/common";

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type Params = Record<string, string | number | boolean | readonly string[] | undefined | null>;

export function toQueryString(params: Params): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(","));
    } else sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** GET a /api/v1 resource and validate the response against the shared schema. */
export async function apiGet<T extends z.ZodType>(
  path: string,
  params: Params,
  schema: T,
  signal?: AbortSignal,
): Promise<z.infer<T>> {
  const res = await fetch(`/api/v1${path}${toQueryString(params)}`, {
    signal,
    headers: { Accept: "application/json" },
    // Location-bearing requests must never land in the HTTP cache.
    cache: "no-store",
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new ApiClientError(
      res.status,
      parsed.success ? parsed.data.error.code : "HTTP_ERROR",
      parsed.success ? parsed.data.error.message : res.statusText,
      parsed.success ? parsed.data.error.details : undefined,
    );
  }
  return schema.parse(body);
}

/** JSON POST/DELETE to /api/v1. `schema` null for 204 responses. */
export async function apiSend<T extends z.ZodType>(
  method: "POST" | "DELETE",
  path: string,
  body: unknown,
  schema: T | null,
): Promise<z.infer<T>> {
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(json);
    throw new ApiClientError(
      res.status,
      parsed.success ? parsed.data.error.code : "HTTP_ERROR",
      parsed.success ? parsed.data.error.message : res.statusText,
      parsed.success ? parsed.data.error.details : undefined,
    );
  }
  return (schema ? schema.parse(json) : null) as z.infer<T>;
}
