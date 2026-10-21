// Applies SQL migrations from ./drizzle. Safe to run in production deploys.
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "./client";

const url = process.argv.includes("--test") ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL (or TEST_DATABASE_URL with --test) is not set");

const { db, pool } = createDb(url);
await migrate(db, { migrationsFolder: "./drizzle" });
await pool.end();
console.log("✓ migrations applied");
