// Warm up routes once before the suite. Against `next dev`, the first request to each route
// compiles it, which can take longer than a test's expect timeout.
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const WARM = [
  "/",
  "/design",
  "/api/v1/health",
  "/api/v1/places/nearby?lat=7.29&lng=80.63",
  "/api/v1/places/points?lat=7.29&lng=80.63",
  "/api/v1/towns?q=ell",
  "/api/v1/towns/ella",
  "/places/sigiriya",
  "/places/sigiriya/opengraph-image",
  "/api/v1/places/sigiriya",
  "/map/tuktrail-light.json",
];

export default async function globalSetup() {
  for (const path of WARM) {
    const res = await fetch(`${BASE_URL}${path}`).catch((e: unknown) => e as Error);
    if (res instanceof Error || !res.ok) {
      throw new Error(`Warm-up failed for ${path}: ${res instanceof Error ? res.message : res.status}`);
    }
  }
}
