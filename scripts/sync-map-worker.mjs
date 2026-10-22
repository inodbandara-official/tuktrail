// MapLibre 6 spawns its web worker via `new URL(<variable>, import.meta.url)`, which bundlers
// (Turbopack included) can't follow. Serve the self-contained worker as a static file instead;
// the map calls setWorkerUrl() with this path. Runs before `dev` and `build` (gitignored output).
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("maplibre-gl/package.json"));
const { version } = JSON.parse(await readFile(join(pkgDir, "package.json"), "utf8"));
await mkdir("public/map", { recursive: true });
await copyFile(join(pkgDir, "dist", "maplibre-gl-worker.mjs"), "public/map/maplibre-gl-worker.mjs");
console.log(`✓ maplibre-gl worker ${version} → public/map/maplibre-gl-worker.mjs`);
