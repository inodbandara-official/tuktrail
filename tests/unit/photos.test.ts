import { describe, expect, it } from "vitest";
import { ALL_SEED_PLACES } from "@/server/seed/all-places";
import { COORD_OVERRIDES } from "@/server/seed/coord-overrides";
import { PHOTO_REJECTIONS } from "@/server/seed/photo-rejections";
import { isFreeLicense, loadPhotos } from "@/server/seed/photos";

const photos = loadPhotos();
const entries = Object.entries(photos).filter(([, v]) => v) as [
  string,
  NonNullable<(typeof photos)[string]>,
][];
const norm = (t: string) =>
  t
    .replace(/^File:/, "")
    .replace(/_/g, " ")
    .toLowerCase();

describe("seed photos (Wikimedia Commons)", () => {
  it("covers most places", () => {
    expect(entries.length).toBeGreaterThanOrEqual(100);
    const slugs = new Set(ALL_SEED_PLACES.map((p) => p.slug));
    for (const [slug] of entries) expect(slugs, slug).toContain(slug);
  });

  it.each(entries)("%s has a free licence, author and Commons source", (_slug, e) => {
    expect(isFreeLicense(e.license), e.license).toBe(true);
    expect(e.author.length).toBeGreaterThan(0);
    expect(e.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    expect(e.thumbUrl).toMatch(/^https:\/\/[a-z]+\.wikimedia\.org\//);
  });

  it("never uses a photo rejected in review", () => {
    for (const [slug, e] of entries) {
      const rejected = PHOTO_REJECTIONS[slug]?.files.map(norm) ?? [];
      expect(rejected, slug).not.toContain(norm(e.file));
    }
  });
});

describe("coordinate overrides", () => {
  it("are sourced and applied", () => {
    for (const [slug, o] of Object.entries(COORD_OVERRIDES)) {
      expect(o.source).toMatch(/^Wikidata Q\d+$/);
      const p = ALL_SEED_PLACES.find((x) => x.slug === slug)!;
      expect(p.lat).toBe(o.lat);
      expect(p.lng).toBe(o.lng);
      expect(p.checkCoords).toBe(false);
    }
  });
});
