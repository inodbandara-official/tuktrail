// Next-only glue: resolve the signed-in user (cookie or bearer token) into a service Actor.
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
