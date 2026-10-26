import { describe, expect, it } from "vitest";
import { slugify } from "@/shared/lib/slug";
import { slugSchema } from "@/shared/schemas/common";
import {
  adminPlaceQuerySchema,
  moderationQuerySchema,
  officialImageMetaSchema,
  rejectRequestSchema,
} from "@/shared/schemas/admin";
import { placeInputSchema } from "@/shared/schemas/place";
import { publicKeyFor } from "@/server/services/moderation";
import { asRejectionReason } from "@/server/services/mappers";

describe("rejection", () => {
  it("needs a note only for 'other'", () => {
    expect(rejectRequestSchema.safeParse({ reason: "poor_quality" }).success).toBe(true);
    expect(rejectRequestSchema.safeParse({ reason: "other" }).success).toBe(false);
    expect(rejectRequestSchema.safeParse({ reason: "other", note: "  ok  " }).success).toBe(false);
    expect(rejectRequestSchema.safeParse({ reason: "other", note: "Watermarked" }).success).toBe(true);
    expect(rejectRequestSchema.safeParse({ reason: "made_up" }).success).toBe(false);
    expect(rejectRequestSchema.safeParse({ reason: "duplicate", note: "x".repeat(301) }).success).toBe(false);
  });

  it("maps legacy free-text reasons to 'other'", () => {
    expect(asRejectionReason(null)).toBeNull();
    expect(asRejectionReason("duplicate")).toBe("duplicate");
    expect(asRejectionReason("Blurry photo")).toBe("other");
  });
});

describe("moderation storage keys", () => {
  it("moves pending renditions to the public prefix, keeping place and image ids", () => {
    expect(publicKeyFor("pending/p1/i1-800.webp")).toBe("places/p1/i1-800.webp");
    expect(() => publicKeyFor("incoming/u/i")).toThrow();
  });
});

describe("admin query schemas", () => {
  it("defaults the queue to pending and caps the page size", () => {
    expect(moderationQuerySchema.parse({})).toEqual({ status: "pending", limit: 12 });
    expect(moderationQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
    expect(adminPlaceQuerySchema.parse({ unverified: "true" })).toEqual({ unverified: true });
  });
});

describe("official image form fields", () => {
  it("normalises empty optional fields and the make-hero flag", () => {
    expect(
      officialImageMetaSchema.parse({
        alt: "Rock",
        attribution: "TukTrail",
        license: "",
        sourceUrl: "",
        makeHero: "true",
      }),
    ).toEqual({ alt: "Rock", attribution: "TukTrail", license: null, sourceUrl: null, makeHero: true });
    expect(
      officialImageMetaSchema.safeParse({ alt: "Rock", attribution: "T", sourceUrl: "javascript:alert(1)" })
        .success,
    ).toBe(false);
  });
});

describe("place form", () => {
  it("builds valid slugs from names", () => {
    for (const name of [
      "Sri Dalada Māligāwa",
      "Lipton's Seat",
      "  Nine  Arch -- Bridge ",
      "Ravana Falls (Ella)",
    ]) {
      expect(slugSchema.safeParse(slugify(name)).success, name).toBe(true);
    }
    expect(slugify("Sri Dalada Māligāwa")).toBe("sri-dalada-maligawa");
    expect(slugify("Lipton's Seat")).toBe("liptons-seat");
  });

  it("never requires factual fields: fees, hours and notes may be null", () => {
    const ok = placeInputSchema.safeParse({
      slug: "x-falls",
      name: "X Falls",
      category: "waterfall",
      location: { lat: 6.8, lng: 80.9 },
      visitRadiusM: 800,
      district: "badulla",
      shortDescription: "Twenty characters at least here.",
      fullDescription: "",
      openingHours: null,
      feeForeignLkr: null,
      feeLocalLkr: null,
      dressCode: null,
      howToGetThere: null,
      bestMonths: [12, 1, 1],
      safetyNotes: null,
      isVerified: false,
      status: "draft",
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.bestMonths).toEqual([1, 12]);
  });
});
