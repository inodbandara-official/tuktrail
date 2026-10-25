"use client";

import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Browser auth client (same origin; cookie session). */
export const authClient = createAuthClient({ plugins: [magicLinkClient()] });

/** Only allow same-site relative paths as post-sign-in destinations. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}
