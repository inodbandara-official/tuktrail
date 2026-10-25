import { describe, expect, it } from "vitest";
import { verifyVisit } from "@/server/services/verification";
import { isFreeLicense } from "@/server/seed/photos";
import { safeNext } from "@/features/auth/client";
import { presignRequestSchema, submissionRequestSchema } from "@/shared/schemas/uploads";

const SIGIRIYA = { lat: 7.957, lng: 80.7603, radiusM: 1500 };
const NEAR = { lat: 7.9572, lng: 80.7601 }; // ~30 m
const COLOMBO = { lat: 6.93, lng: 79.85 }; // ~150 km

describe("verifyVisit", () => {
  it("accepts everything when the device is within the radius", () => {
    const r = verifyVisit({ place: SIGIRIYA, device: NEAR, exif: [null, COLOMBO] });
    expect(r).toMatchObject({ ok: true, method: "device" });
  });

  it("accepts when every photo's EXIF GPS is within the radius", () => {
    const r = verifyVisit({ place: SIGIRIYA, device: null, exif: [NEAR, NEAR] });
    expect(r).toMatchObject({ ok: true, method: "exif" });
    if (r.ok) expect(r.distanceM).toBeLessThan(100);
  });

  it("rejects if any photo lacks in-radius EXIF and the device can't vouch", () => {
    const r = verifyVisit({ place: SIGIRIYA, device: COLOMBO, exif: [NEAR, null, COLOMBO] });
    expect(r).toEqual({ ok: false, closestM: expect.any(Number), failingFiles: [1, 2] });
    if (!r.ok) expect(r.closestM).toBeLessThan(100);
  });

  it("allows a little GPS inaccuracy at the edge, but caps the allowance", () => {
    const edge = { lat: 7.957 + 1580 / 111_195, lng: 80.7603 }; // ~1.58 km away
    expect(verifyVisit({ place: SIGIRIYA, device: { ...edge, accuracyM: 100 }, exif: [] }).ok).toBe(true);
    const far = { lat: 7.957 + 2000 / 111_195, lng: 80.7603 }; // 2 km away
    expect(verifyVisit({ place: SIGIRIYA, device: { ...far, accuracyM: 5000 }, exif: [] }).ok).toBe(false);
  });

  it("reports no evidence when there is none", () => {
    expect(verifyVisit({ place: SIGIRIYA, device: null, exif: [null] })).toEqual({
      ok: false,
      closestM: null,
      failingFiles: [0],
    });
  });
});

describe("upload schemas", () => {
  const placeId = "8a4b2f4e-6f1c-4a9e-9f43-2d6f8b7c1a10";
  it("limits count, type and size", () => {
    expect(
      presignRequestSchema.safeParse({ placeId, files: [{ contentType: "image/jpeg", size: 1000 }] }).success,
    ).toBe(true);
    expect(
      presignRequestSchema.safeParse({ placeId, files: [{ contentType: "image/gif", size: 1000 }] }).success,
    ).toBe(false);
    expect(
      presignRequestSchema.safeParse({
        placeId,
        files: [{ contentType: "image/png", size: 11 * 1024 * 1024 }],
      }).success,
    ).toBe(false);
    const six = Array.from({ length: 6 }, () => ({ contentType: "image/webp" as const, size: 10 }));
    expect(presignRequestSchema.safeParse({ placeId, files: six }).success).toBe(false);
  });
  it("caps captions", () => {
    expect(
      submissionRequestSchema.safeParse({ placeId, intentIds: [placeId], caption: "x".repeat(201) }).success,
    ).toBe(false);
  });
});

describe("photo licence policy", () => {
  it.each(["CC BY-SA 4.0", "CC BY 2.0", "CC0", "Public domain", "FAL", "CC BY-SA 3.0 igo", "Attribution"])(
    "accepts %s",
    (l) => expect(isFreeLicense(l)).toBe(true),
  );
  it.each(["CC BY-NC-SA 2.0", "CC BY-ND 4.0", "Fair use", "GFDL", "", "All rights reserved"])(
    "rejects %s",
    (l) => expect(isFreeLicense(l)).toBe(false),
  );
});

describe("safeNext", () => {
  it("only allows same-site relative paths", () => {
    expect(safeNext("/places/sigiriya")).toBe("/places/sigiriya");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext(null)).toBe("/");
  });
});
