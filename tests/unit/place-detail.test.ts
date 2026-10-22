import { describe, expect, it } from "vitest";
import { jsonLdString, touristAttractionJsonLd } from "@/features/place/jsonld";
import { formatDistance, haversineM } from "@/shared/lib/geo";
import { placeDetailSchema, type PlaceDetail } from "@/shared/schemas/place";

const place: PlaceDetail = {
  id: "8a4b2f4e-6f1c-4a9e-9f43-2d6f8b7c1a10",
  slug: "sigiriya",
  name: "Sigiriya </script> Rock",
  category: "heritage_site",
  location: { lat: 7.957, lng: 80.7603 },
  district: "matale",
  province: "central",
  shortDescription: "Short.",
  bestMonths: [1, 2],
  isVerified: false,
  heroImage: null,
  fullDescription: "Full.",
  visitRadiusM: 1500,
  openingHours: null,
  feeForeignLkr: null,
  feeLocalLkr: null,
  dressCode: null,
  howToGetThere: "By tuk-tuk.",
  safetyNotes: null,
  images: [],
  nearestTown: { slug: "sigiriya", name: "Sigiriya", distanceM: 607 },
  updatedAt: new Date("2026-10-22T00:00:00Z").toISOString(),
};

describe("TouristAttraction JSON-LD", () => {
  it("contains only facts we hold", () => {
    const ld = touristAttractionJsonLd(place, "https://tuktrail.test/places/sigiriya", "Central");
    expect(ld).toMatchObject({
      "@type": "TouristAttraction",
      geo: { latitude: 7.957, longitude: 80.7603 },
      address: { addressRegion: "Central", addressCountry: "LK" },
    });
    expect(ld).not.toHaveProperty("openingHoursSpecification");
    expect(ld).not.toHaveProperty("isAccessibleForFree");
    expect(ld).not.toHaveProperty("image");
  });

  it("escapes < so content can't close the script tag", () => {
    const s = jsonLdString(touristAttractionJsonLd(place, "u", "r"));
    expect(s).not.toContain("</script>");
    expect(s).toContain("\\u003c/script>");
    expect(JSON.parse(s).name).toBe("Sigiriya </script> Rock");
  });

  it("detail fixture matches the shared schema", () => {
    expect(placeDetailSchema.parse(place)).toEqual(place);
  });
});

describe("geo helpers", () => {
  it("haversine matches known distances", () => {
    // Colombo Fort → Kandy clock tower ≈ 94 km straight line.
    const d = haversineM({ lat: 6.9344, lng: 79.8428 }, { lat: 7.2936, lng: 80.6337 });
    expect(d / 1000).toBeGreaterThan(90);
    expect(d / 1000).toBeLessThan(98);
    expect(haversineM({ lat: 7, lng: 80 }, { lat: 7, lng: 80 })).toBe(0);
  });

  it("formats metres and kilometres", () => {
    expect(formatDistance(607)).toEqual({ value: "610", unit: "m" });
    expect(formatDistance(2440)).toEqual({ value: "2.4", unit: "km" });
    expect(formatDistance(48_300)).toEqual({ value: "48", unit: "km" });
  });
});
