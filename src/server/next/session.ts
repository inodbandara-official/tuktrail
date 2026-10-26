// Next-only glue: resolve the signed-in user (cookie or bearer token) into a service Actor.
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getAuth } from "../auth/auth";
import type { Actor } from "../services/context";
import type { UserRole } from "@/shared/constants/places";

export interface SessionUser extends Actor {
  name: string;
  email: string;
  image: string | null;
}

export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: string };
  return {
    id: u.id,
    role: (u.role === "admin" ? "admin" : "user") satisfies UserRole,
    name: u.name,
    email: u.email,
    image: u.image ?? null,
  };
}

/**
 * For admin pages (call inside <Suspense>): the signed-in admin, or a plain 404 for everyone
 * else, so the admin area doesn't advertise itself. Cached per request.
 */
export const requireAdminPage = cache(async (): Promise<SessionUser> => {
  const user = await getSessionUser(await headers());
  if (user?.role !== "admin") notFound();
  return user;
});
