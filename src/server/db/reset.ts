// Development only: drops and recreates the public schema. Refuses to run in production.
import pg from "pg";

if (process.env.NODE_ENV === "production") throw new Error("db:reset is disabled in production");
const url = process.argv.includes("--test") ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
if (!/localhost|127\.0\.0\.1/.test(url)) throw new Error("db:reset only runs against a local database");

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(
  "DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;",
);
await client.end();
console.log("✓ database reset");
