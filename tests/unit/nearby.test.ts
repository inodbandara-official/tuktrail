import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor, queryFingerprint } from "@/server/services/cursor";
import { AppError } from "@/server/services/errors";
import { circleBbox, circlePolygon, destination } from "@/components/map/geo";
import { googleMapsDirectionsUrl } from "@/shared/lib/directions";
import { mapPointsQuerySchema, nearbyQuerySchema, roundCoord } from "@/shared/schemas/nearby";
import { colomboMonth } from "@/features/nearby/params";

describe("nearbyQuerySchema", () => {
  it("rounds coordinates to ~110 m and applies defaults", () => {
    const q = nearbyQuerySchema.parse({ lat: "7.293612", lng: "80.641309" });
    expect(q).toMatchObject({ lat: 7.294, lng: 80.641, radius_km: 25, limit: 20 });
    expect(q.q).toBeUndefined();
  });

  it("accepts categories as CSV or repeated params", () => {
    expect(nearbyQuerySchema.parse({ lat: 7, lng: 80, category: "beach,waterfall" }).category).toEqual([
      "beach",
      "waterfall",
    ]);
    expect(nearbyQuerySchema.parse({ lat: 7, lng: 80, category: ["temple", "lake"] }).category).toEqual([
      "temple",
      "lake",
    ]);
  });

  it("rejects unknown radii, categories, months and oversized pages", () => {
    expect(nearbyQuerySchema.safeParse({ lat: 7, lng: 80, radius_km: 7 }).success).toBe(false);
    expect(nearbyQuerySchema.safeParse({ lat: 7, lng: 80, category: "casino" }).success).toBe(false);
    expect(nearbyQuerySchema.safeParse({ lat: 7, lng: 80, month: 13 }).success).toBe(false);
    expect(nearbyQuerySchema.safeParse({ lat: 7, lng: 80, limit: 500 }).success).toBe(false);
    expect(nearbyQuerySchema.safeParse({ lat: 95, lng: 80 }).success).toBe(false);
  });

  it("treats blank search as no search", () => {
    expect(mapPointsQuerySchema.parse({ lat: 7, lng: 80, q: "   " }).q).toBeUndefined();
  });

  it("roundCoord keeps three decimals", () => {
    expect(roundCoord(6.92712345)).toBe(6.927);
    expect(roundCoord(-0.0004)).toBe(-0);
  });
});

describe("distance cursor", () => {
  const fp = queryFingerprint([7.29, 80.63, 25, [], 0, ""]);

  it("round-trips exactly", () => {
    const c = { d: 1234.567890123, id: "70e5ca1f-0af1-4529-a920-f32273ec3043" };
    expect(decodeCursor(encodeCursor(c, fp), fp)).toEqual(c);
  });

  it("is bound to the query it came from", () => {
    const raw = encodeCursor({ d: 10, id: "70e5ca1f-0af1-4529-a920-f32273ec3043" }, fp);
    const other = queryFingerprint([7.29, 80.63, 50, [], 0, ""]);
    expect(() => decodeCursor(raw, other)).toThrow(AppError);
  });

  it("rejects garbage", () => {
    expect(() => decodeCursor("not-a-cursor", fp)).toThrow(AppError);
    expect(() => decodeCursor(Buffer.from('[1,"x;drop",""]').toString("base64url"), fp)).toThrow(AppError);
  });
});

describe("map geometry", () => {
  const kandy = { lat: 7.2906, lng: 80.6337 };

  it("destination() moves the requested distance", () => {
    const north = destination(kandy, 10_000, 0);
    expect(north.lat - kandy.lat).toBeCloseTo(10_000 / 111_195, 3);
    expect(north.lng).toBeCloseTo(kandy.lng, 6);
  });

  it("circle bbox contains the circle", () => {
    const [w, s, e, n] = circleBbox(kandy, 25_000);
    const ring = circlePolygon(kandy, 25_000).geometry.coordinates[0]!;
    expect(ring[0]).toEqual(ring.at(-1));
    for (const [lng, lat] of ring) {
      expect(lng).toBeGreaterThanOrEqual(w - 1e-9);
      expect(lng).toBeLessThanOrEqual(e + 1e-9);
      expect(lat).toBeGreaterThanOrEqual(s - 1e-9);
      expect(lat).toBeLessThanOrEqual(n + 1e-9);
    }
  });
});

describe("directions deep link", () => {
  it("is a keyless Google Maps universal URL without an origin", () => {
    const url = new URL(googleMapsDirectionsUrl({ lat: 7.957, lng: 80.7603 }));
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("destination")).toBe("7.957,80.7603");
    expect(url.searchParams.has("origin")).toBe(false);
    expect(url.searchParams.has("key")).toBe(false);
  });
});

describe("colomboMonth", () => {
  it("uses Sri Lanka time, not the device's", () => {
    // 2026-10-31T20:00Z is already 1 November 01:30 in Colombo (UTC+5:30).
    expect(colomboMonth(new Date("2026-10-31T20:00:00Z"))).toBe(11);
    expect(colomboMonth(new Date("2026-10-31T18:00:00Z"))).toBe(10);
  });
});
