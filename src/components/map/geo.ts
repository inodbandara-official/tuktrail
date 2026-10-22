import type { Feature, Polygon } from "geojson";
import type { LatLng } from "@/shared/schemas/common";

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle point at `distanceM` and `bearingDeg` from `origin`. */
export function destination(origin: LatLng, distanceM: number, bearingDeg: number): LatLng {
  const δ = distanceM / EARTH_RADIUS_M;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(origin.lat);
  const λ1 = toRad(origin.lng);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: toDeg(φ2), lng: toDeg(λ2) };
}

/** GeoJSON polygon approximating a circle (for the search-radius overlay). */
export function circlePolygon(center: LatLng, radiusM: number, steps = 72): Feature<Polygon> {
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const p = destination(center, radiusM, (i / steps) * 360);
    ring.push([p.lng, p.lat]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}

/** [west, south, east, north] */
export type Bbox = [number, number, number, number];

export function circleBbox(center: LatLng, radiusM: number): Bbox {
  const n = destination(center, radiusM, 0);
  const e = destination(center, radiusM, 90);
  const s = destination(center, radiusM, 180);
  const w = destination(center, radiusM, 270);
  return [w.lng, s.lat, e.lng, n.lat];
}

export function pointsBbox(points: LatLng[]): Bbox | null {
  if (points.length === 0) return null;
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of points) {
    w = Math.min(w, p.lng);
    e = Math.max(e, p.lng);
    s = Math.min(s, p.lat);
    n = Math.max(n, p.lat);
  }
  return [w, s, e, n];
}
