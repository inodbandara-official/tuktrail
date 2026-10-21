import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  // PostGIS owns these; never let drizzle-kit try to manage them.
  extensionsFilters: ["postgis"],
  strict: true,
  verbose: true,
});
