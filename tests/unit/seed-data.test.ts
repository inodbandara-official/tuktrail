import { describe, expect, it } from "vitest";
import { PROVINCES, SRI_LANKA_BOUNDS, provinceOf } from "@/shared/constants/geography";
import { SHORT_DESCRIPTION_MAX } from "@/shared/constants/places";
import { ALL_SEED_PLACES as SEED_PLACES } from "@/server/seed/all-places";
import { HOW_TO_GET_THERE } from "@/server/seed/access";
import { SEED_TOWNS } from "@/server/seed/towns";

const inSriLanka = (lat: number, lng: number) =>
  lat > SRI_LANKA_BOUNDS.south &&
  lat < SRI_LANKA_BOUNDS.north &&
  lng > SRI_LANKA_BOUNDS.west &&
  lng < SRI_LANKA_BOUNDS.east;

describe("seed places", () => {
  it("has roughly 30 places with unique slugs", () => {
    expect(SEED_PLACES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(SEED_PLACES.map((p) => p.slug)).size).toBe(SEED_PLACES.length);
  });

  it("every place has access notes, and no access note is orphaned", () => {
    for (const p of SEED_PLACES) expect(p.howToGetThere, p.slug).toBeTruthy();
    const slugs = new Set(SEED_PLACES.map((p) => p.slug));
    for (const slug of Object.keys(HOW_TO_GET_THERE)) expect(slugs, slug).toContain(slug);
  });

  it("covers all 9 provinces", () => {
    const covered = new Set(SEED_PLACES.map((p) => provinceOf(p.district)));
    for (const prov of PROVINCES) expect(covered, prov).toContain(prov);
  });

  it.each(SEED_PLACES.map((p) => [p.slug, p] as const))("%s is valid", (_slug, p) => {
    expect(inSriLanka(p.lat, p.lng)).toBe(true);
    expect(p.shortDescription.length).toBeLessThanOrEqual(SHORT_DESCRIPTION_MAX);
    expect(p.fullDescription.length).toBeGreaterThan(p.shortDescription.length);
    expect(p.visitRadiusM).toBeGreaterThan(0);
    for (const m of p.bestMonths) expect(m >= 1 && m <= 12).toBe(true);
  });

  it("never carries invented fees, hours or phone numbers", () => {
    for (const p of SEED_PLACES) {
      const text = `${p.shortDescription} ${p.fullDescription} ${p.dressCode ?? ""} ${p.safetyNotes ?? ""} ${p.howToGetThere ?? ""}`;
      expect(text, p.slug).not.toMatch(/\bLKR\b|Rs\.?\s?\d|\$\s?\d|USD/i);
      expect(text, p.slug).not.toMatch(/\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i);
      expect(text, p.slug).not.toMatch(/\+94|\b0\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/);
      expect(p).not.toHaveProperty("feeForeignLkr");
      expect(p).not.toHaveProperty("openingHours");
    }
  });
});

describe("seed towns", () => {
  it("includes all 25 district capitals and unique names", () => {
    expect(SEED_TOWNS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(SEED_TOWNS.map((t) => t.name)).size).toBe(SEED_TOWNS.length);
    expect(new Set(SEED_TOWNS.map((t) => t.district)).size).toBe(25);
    for (const t of SEED_TOWNS) expect(inSriLanka(t.lat, t.lng), t.name).toBe(true);
  });
});
