import type { PlaceDetail } from "@/shared/schemas/place";

/**
 * schema.org TouristAttraction. Only facts we hold: no opening hours or prices unless
 * they've been entered (and would only be entered once verified).
 */
export function touristAttractionJsonLd(place: PlaceDetail, url: string, regionLabel: string) {
  const image = place.images
    .map((img) => img.sources.find((s) => s.format === "webp" && s.width === 1600)?.url)
    .filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.name,
    description: place.shortDescription,
    url,
    ...(image.length ? { image } : {}),
    geo: { "@type": "GeoCoordinates", latitude: place.location.lat, longitude: place.location.lng },
    address: { "@type": "PostalAddress", addressRegion: regionLabel, addressCountry: "LK" },
    touristType: "Sightseeing",
    ...(place.feeForeignLkr === 0 && place.feeLocalLkr === 0 ? { isAccessibleForFree: true } : {}),
  };
}

/** Serialise for a <script type="application/ld+json">, escaping `<` as the Next docs advise. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
