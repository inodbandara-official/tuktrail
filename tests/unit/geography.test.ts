import { describe, expect, it } from "vitest";
import { parseWkbPoint } from "@/server/db/geography";
import { DISTRICTS, PROVINCES, provinceOf } from "@/shared/constants/geography";

describe("parseWkbPoint", () => {
  it("parses little-endian EWKB with SRID 4326 (what PostGIS returns)", () => {
    // SELECT ST_SetSRID(ST_MakePoint(80.7603, 7.957), 4326)::geography;
    const buf = Buffer.alloc(25);
    buf.writeUInt8(1, 0);
    buf.writeUInt32LE(0x20000001, 1);
    buf.writeUInt32LE(4326, 5);
    buf.writeDoubleLE(80.7603, 9);
    buf.writeDoubleLE(7.957, 17);
    expect(parseWkbPoint(buf.toString("hex"))).toEqual({ lat: 7.957, lng: 80.7603 });
  });

  it("parses big-endian WKB without SRID", () => {
    const buf = Buffer.alloc(21);
    buf.writeUInt8(0, 0);
    buf.writeUInt32BE(1, 1);
    buf.writeDoubleBE(79.8612, 5);
    buf.writeDoubleBE(6.9271, 13);
    expect(parseWkbPoint(buf.toString("hex"))).toEqual({ lat: 6.9271, lng: 79.8612 });
  });

  it("rejects non-point geometries", () => {
    const buf = Buffer.alloc(9);
    buf.writeUInt8(1, 0);
    buf.writeUInt32LE(3, 1); // polygon
    expect(() => parseWkbPoint(buf.toString("hex"))).toThrow(/Point/);
  });
});

describe("administrative geography", () => {
  it("has 9 provinces and 25 unique districts", () => {
    expect(PROVINCES).toHaveLength(9);
    expect(new Set(DISTRICTS).size).toBe(25);
  });

  it("maps districts to provinces", () => {
    expect(provinceOf("kandy")).toBe("central");
    expect(provinceOf("monaragala")).toBe("uva");
    expect(provinceOf("trincomalee")).toBe("eastern");
  });
});
