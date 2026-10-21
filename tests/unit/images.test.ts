import exifr from "exifr";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processImage } from "@/server/lib/images";
import { IMAGE_FORMATS, IMAGE_WIDTHS } from "@/shared/constants/places";

/** A JPEG carrying EXIF GPS (Sigiriya) and camera metadata, like a phone photo. */
async function jpegWithGps(width = 2000, height = 1500) {
  return sharp({ create: { width, height, channels: 3, background: "#9A3B1F" } })
    .jpeg()
    .withExif({
      IFD0: { Make: "TestCam", Model: "T1", Orientation: "1" },
      IFD3: {
        GPSLatitudeRef: "N",
        GPSLatitude: "7/1 57/1 2520/100",
        GPSLongitudeRef: "E",
        GPSLongitude: "80/1 45/1 3708/100",
      },
    })
    .toBuffer();
}

describe("processImage", () => {
  it("fixture really contains GPS (sanity check)", async () => {
    const gps = await exifr.gps(await jpegWithGps());
    expect(gps?.latitude).toBeCloseTo(7.957, 2);
    expect(gps?.longitude).toBeCloseTo(80.7603, 2);
  });

  it("strips all EXIF/GPS from every output", async () => {
    const out = await processImage(await jpegWithGps(), "test/img");
    for (const f of out.files) {
      const meta = await sharp(f.body).metadata();
      expect(meta.exif, f.key).toBeUndefined();
      expect(await exifr.gps(f.body).catch(() => undefined), f.key).toBeUndefined();
    }
  });

  it("renders AVIF + WebP at each responsive width with correct keys", async () => {
    const out = await processImage(await jpegWithGps(), "places/p1/i1");
    expect(out.files).toHaveLength(IMAGE_FORMATS.length * IMAGE_WIDTHS.length);
    expect(out.variants.webp[800]).toBe("places/p1/i1-800.webp");
    const w400 = out.files.find((f) => f.key.endsWith("-400.avif"))!;
    expect((await sharp(w400.body).metadata()).width).toBe(400);
    expect(out.width).toBe(1600);
    expect(out.height).toBe(1200);
    expect(out.lqip).toMatch(/^data:image\/webp;base64,/);
    expect(out.lqip.length).toBeLessThan(1500);
  });

  it("never upscales small images", async () => {
    const out = await processImage(await jpegWithGps(600, 400), "t/s");
    expect(out.width).toBe(600);
    const big = out.files.find((f) => f.key.endsWith("-1600.webp"))!;
    expect((await sharp(big.body).metadata()).width).toBe(600);
  });

  it("rejects non-images", async () => {
    await expect(processImage(Buffer.from("not an image"), "t/x")).rejects.toThrow();
  });
});
