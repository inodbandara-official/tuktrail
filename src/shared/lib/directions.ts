import type { LatLng } from "../schemas/common";

/**
 * Google Maps directions via a universal URL deep link (no API key, no Directions API).
 * Opens the Google Maps app on phones when installed, the website otherwise.
 * The origin is left out on purpose: Maps uses the device's own location.
 */
export function googleMapsDirectionsUrl(destination: LatLng): string {
  const params = new URLSearchParams({ api: "1", destination: `${destination.lat},${destination.lng}` });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
