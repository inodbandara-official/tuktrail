import { describe, expect, it } from "vitest";
import { placeInputSchema, openingHoursSchema, placeSummarySchema } from "@/shared/schemas/place";
import { toPlaceSummary } from "@/server/services/mappers";
import type { Storage } from "@/server/storage/storage";

const validInput = {
  slug: "test-falls",
  name: "Test Falls",
  category: "waterfall",
  location: { lat: 6.84, lng: 81.05 },
  visitRadiusM: 500,
  district: "badulla",
  shortDescription: "A short but valid description of a waterfall.",
  fullDescription: "Longer text.",
  openingHours: null,
  feeForeignLkr: null,
  feeLocalLkr: null,
  dressCode: null,
  howToGetThere: null,
  bestMonths: [3, 1, 1, 12],
  safetyNotes: null,
  isVerified: false,
  status: "draft",
};

describe("placeInputSchema", () => {
  it("accepts nulls for unverifiable facts and normalises months", () => {
    const parsed = placeInputSchema.parse(validInput);
    expect(parsed.bestMonths).toEqual([1, 3, 12]);
    expect(parsed.feeForeignLkr).toBeNull();
  });

  it("rejects bad slugs, long short descriptions and out-of-range months", () => {
    expect(placeInputSchema.safeParse({ ...validInput, slug: "Bad Slug" }).success).toBe(false);
    expect(placeInputSchema.safeParse({ ...validInput, shortDescription: "x".repeat(281) }).success).toBe(
      false,
    );
    expect(placeInputSchema.safeParse({ ...validInput, bestMonths: [13] }).success).toBe(false);
    expect(placeInputSchema.safeParse({ ...validInput, district: "atlantis" }).success).toBe(false);
  });

  it("validates opening hours as 24h HH:MM", () => {
    expect(
      openingHoursSchema.safeParse({ weekly: { mon: [{ open: "06:00", close: "18:00" }] } }).success,
    ).toBe(true);
    expect(openingHoursSchema.safeParse({ weekly: { mon: [{ open: "6am", close: "18:00" }] } }).success).toBe(
      false,
    );
  });
});

describe("toPlaceSummary", () => {
  const storage = { publicUrl: (k: string) => `https://cdn.test/${k}` } as Storage;
  const now = new Date();
  const place = {
    id: "8a4b2f4e-6f1c-4a9e-9f43-2d6f8b7c1a10",
    slug: "test-falls",
    name: "Test Falls",
    category: "waterfall" as const,
    location: { lat: 6.84, lng: 81.05 },
    visitRadiusM: 500,
    district: "badulla" as const,
    province: "uva" as const,
    shortDescription: "Short",
    fullDescription: "Full",
    openingHours: null,
    feeForeignLkr: null,
    feeLocalLkr: null,
    dressCode: null,
    howToGetThere: null,
    bestMonths: [1, 2],
    safetyNotes: null,
    heroImageId: null,
    isVerified: false,
    status: "published" as const,
    createdAt: now,
    updatedAt: now,
  };
  const variants = {
    avif: { 400: "a-400.avif", 800: "a-800.avif", 1600: "a-1600.avif" },
    webp: { 400: "a-400.webp", 800: "a-800.webp", 1600: "a-1600.webp" },
  };
  const hero = {
    id: "1b1b2f4e-6f1c-4a9e-9f43-2d6f8b7c1a10",
    placeId: place.id,
    submissionId: null,
    variants,
    width: 1600,
    height: 1000,
    lqip: "data:image/webp;base64,AAAA",
    altText: "Alt",
    source: "user" as const,
    attribution: null,
    license: null,
    uploadedBy: "user-1",
    status: "approved" as const,
    rejectionReason: null,
    captureLat: 6.8401,
    captureLng: 81.0502,
    moderatedBy: "admin-1",
    moderatedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  it("produces a DTO that matches the shared schema", () => {
    const dto = toPlaceSummary(place, hero, storage, 1234.6);
    expect(placeSummarySchema.parse(dto)).toEqual(dto);
    expect(dto.distanceM).toBe(1235);
    expect(dto.heroImage?.sources).toHaveLength(6);
  });

  it("never leaks capture coordinates or uploader identity", () => {
    const json = JSON.stringify(toPlaceSummary(place, hero, storage));
    expect(json).not.toMatch(/captureLat|captureLng|6\.8401|81\.0502|uploadedBy|user-1|moderatedBy/);
  });

  it("hides heroes that are not approved", () => {
    expect(toPlaceSummary(place, { ...hero, status: "pending" }, storage).heroImage).toBeNull();
  });
});
