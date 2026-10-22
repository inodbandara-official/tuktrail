import type { LatLng } from "../schemas/common";

/** Great-circle distance in metres (haversine). */
export function haversineM(a: LatLng, b: LatLng): number {
  const R = 6_371_008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "850 m" / "2.4 km" / "48 km" — numbers only; units are added by the caller's message. */
export function formatDistance(m: number): { value: string; unit: "m" | "km" } {
  if (m < 1000) return { value: String(Math.round(m / 10) * 10), unit: "m" };
  const km = m / 1000;
  return { value: km < 10 ? km.toFixed(1) : String(Math.round(km)), unit: "km" };
}
