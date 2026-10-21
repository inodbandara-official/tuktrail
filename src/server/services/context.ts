import type { Db } from "../db/client";
import type { Storage } from "../storage/storage";
import type { UserRole } from "@/shared/constants/places";

export interface Actor {
  id: string;
  role: UserRole;
}

/**
 * Everything a service needs, passed explicitly. Services never import Next.js,
 * read cookies or touch Request objects — so they can back a mobile API unchanged.
 */
export interface Ctx {
  db: Db;
  storage: Storage;
  now: () => Date;
  actor: Actor | null;
}
