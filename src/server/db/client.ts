import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __tuktrailPool?: Pool; __tuktrailDb?: Db };

export function createDb(connectionString: string): { db: Db; pool: Pool } {
  const pool = new Pool({ connectionString, max: 10 });
  const db = drizzle({ client: pool, schema, casing: "snake_case" });
  return { db, pool };
}

export function getDb(): Db {
  if (!globalForDb.__tuktrailDb) {
    const { db, pool } = createDb(env().DATABASE_URL);
    globalForDb.__tuktrailDb = db;
    globalForDb.__tuktrailPool = pool;
  }
  return globalForDb.__tuktrailDb;
}

export { schema };
