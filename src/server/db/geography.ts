import { customType } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { LatLng } from "@/shared/schemas/common";

/**
 * Parse a PostGIS (E)WKB hex string for a POINT into { lat, lng }.
 * node-postgres returns geography columns in this form.
 */
export function parseWkbPoint(hex: string): LatLng {
  const buf = Buffer.from(hex, "hex");
  const littleEndian = buf.readUInt8(0) === 1;
  const readU32 = (o: number) => (littleEndian ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const readF64 = (o: number) => (littleEndian ? buf.readDoubleLE(o) : buf.readDoubleBE(o));

  const rawType = readU32(1);
  const hasSrid = (rawType & 0x20000000) !== 0;
  const geomType = rawType & 0x0fffffff;
  if (geomType !== 1) throw new Error(`Expected WKB Point, got type ${geomType}`);

  const offset = hasSrid ? 9 : 5;
  return { lng: readF64(offset), lat: readF64(offset + 8) };
}

/** `geography(Point, 4326)`; maps to `{ lat, lng }` in TypeScript. */
export const geographyPoint = customType<{ data: LatLng; driverData: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
  toDriver(value) {
    return sql`ST_SetSRID(ST_MakePoint(${value.lng}, ${value.lat}), 4326)::geography`;
  },
  fromDriver(value) {
    return parseWkbPoint(value);
  },
});
