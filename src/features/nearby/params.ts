"use client";

import {
  createParser,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { DEFAULT_RADIUS_KM, PLACE_CATEGORIES, RADIUS_OPTIONS_KM } from "@/shared/constants/places";
import { SRI_LANKA_BOUNDS } from "@/shared/constants/geography";
import type { LatLng } from "@/shared/schemas/common";
import { roundCoord } from "@/shared/schemas/nearby";

/** "7.293,80.635" ⇄ { lat, lng }. Only user-chosen points go in the URL — never GPS. */
const parseAsLatLng = createParser<LatLng>({
  parse(v) {
    const [a, b] = v.split(",").map(Number);
    if (a === undefined || b === undefined || !Number.isFinite(a) || !Number.isFinite(b)) return null;
    const { south, north, west, east } = SRI_LANKA_BOUNDS;
    if (a < south || a > north || b < west || b > east) return null;
    return { lat: roundCoord(a), lng: roundCoord(b) };
  },
  serialize: (v) => `${roundCoord(v.lat)},${roundCoord(v.lng)}`,
  eq: (a, b) => a.lat === b.lat && a.lng === b.lng,
});

export const nearbyParsers = {
  cat: parseAsArrayOf(parseAsStringLiteral(PLACE_CATEGORIES)).withDefault([]),
  month: parseAsBoolean.withDefault(false),
  q: parseAsString.withDefault(""),
  r: parseAsNumberLiteral(RADIUS_OPTIONS_KM).withDefault(DEFAULT_RADIUS_KM),
  town: parseAsString,
  at: parseAsLatLng,
};

/** Filters and user-chosen origin, reflected in the URL so views can be shared. */
export function useNearbyParams() {
  return useQueryStates(nearbyParsers, { history: "replace", clearOnDefault: true, scroll: false });
}

/** Current month in Sri Lanka (1–12), independent of the device's time zone. */
export function colomboMonth(date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Colombo", month: "numeric" }).format(date));
}
