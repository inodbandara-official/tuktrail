// Provider-agnostic map contract. The app only talks to <PlacesMap>; swapping MapLibre for
// another provider means writing one new component that implements PlacesMapProps.
import type { LatLng } from "@/shared/schemas/common";
import type { MapPoint } from "@/shared/schemas/nearby";

export type OriginKind = "gps" | "town" | "pin" | "default";

export interface MapInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PlacesMapProps {
  points: MapPoint[];
  origin: { point: LatLng; kind: OriginKind } | null;
  /** Draws the search circle and frames it; null when searching island-wide. */
  radiusKm: number | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Pan to `selectedId` when this changes (selection came from the list). */
  focusNonce: number;
  /** When it changes the map re-frames (origin, radius or result set changed). */
  frameKey: string;
  /** "Pick a spot" fallback: next tap on the map reports a location instead of selecting. */
  pickMode: boolean;
  onPick: (point: LatLng) => void;
  colorScheme: "light" | "dark";
  /** Screen area covered by overlays (e.g. the mobile bottom sheet), in px. */
  insets: MapInsets;
  /** Closest zoom used when framing results (default 14). Lower = more context. */
  frameMaxZoom?: number;
  onStatusChange?: (status: "loading" | "ready" | "error") => void;
}
