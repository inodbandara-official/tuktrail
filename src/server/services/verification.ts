import type { VerificationMethod } from "@/shared/constants/places";
import type { LatLng } from "@/shared/schemas/common";
import { haversineM } from "@/shared/lib/geo";

/** Phone GPS can be off by tens of metres; give the benefit of the doubt, but not much. */
const MAX_ACCURACY_ALLOWANCE_M = 150;

export type VisitCheck =
  | { ok: true; method: VerificationMethod; distanceM: number; point: LatLng }
  | { ok: false; closestM: number | null; failingFiles: number[] };

/**
 * A submission is accepted if EITHER the device location at upload time is within the place's
 * visit radius (covers every photo), OR every photo's own EXIF GPS is within the radius.
 */
export function verifyVisit(input: {
  place: LatLng & { radiusM: number };
  device: (LatLng & { accuracyM?: number }) | null | undefined;
  exif: (LatLng | null)[];
}): VisitCheck {
  const { place, device, exif } = input;
  const distances: number[] = [];

  if (device) {
    const d = haversineM(device, place);
    distances.push(d);
    const allowance = Math.min(device.accuracyM ?? 0, MAX_ACCURACY_ALLOWANCE_M);
    if (d - allowance <= place.radiusM) {
      return {
        ok: true,
        method: "device",
        distanceM: Math.round(d),
        point: { lat: device.lat, lng: device.lng },
      };
    }
  }

  const exifDistances = exif.map((p) => (p ? haversineM(p, place) : null));
  for (const d of exifDistances) if (d !== null) distances.push(d);
  const failingFiles = exifDistances.flatMap((d, i) => (d === null || d > place.radiusM ? [i] : []));

  if (exif.length > 0 && failingFiles.length === 0) {
    const worst = Math.max(...(exifDistances as number[]));
    return { ok: true, method: "exif", distanceM: Math.round(worst), point: exif[0]! };
  }

  return {
    ok: false,
    closestM: distances.length ? Math.round(Math.min(...distances)) : null,
    failingFiles,
  };
}
