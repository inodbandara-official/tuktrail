import sharp from "sharp";
import { IMAGE_FORMATS, IMAGE_WIDTHS, type ImageFormat, type ImageWidth } from "@/shared/constants/places";
import type { ImageVariants } from "../db/schema";

export interface ProcessedImage {
  width: number;
  height: number;
  lqip: string;
  variants: ImageVariants;
  files: { key: string; body: Buffer; contentType: string }[];
}

const QUALITY: Record<ImageFormat, number> = { avif: 50, webp: 74 };
const MAX_INPUT_PIXELS = 60_000_000;

/**
 * Normalises orientation, strips ALL metadata (EXIF incl. GPS, XMP, ICC beyond sRGB),
 * and renders AVIF + WebP at each responsive width, plus a tiny blurred LQIP.
 * sharp drops metadata by default; we never call keepMetadata()/withMetadata().
 */
export async function processImage(input: Buffer, keyPrefix: string): Promise<ProcessedImage> {
  const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" }).autoOrient();
  const meta = await base.clone().metadata();
  const srcWidth = meta.autoOrient?.width ?? meta.width;
  const srcHeight = meta.autoOrient?.height ?? meta.height;
  if (!srcWidth || !srcHeight) throw new Error("Unreadable image dimensions");

  const files: ProcessedImage["files"] = [];
  const variants = {} as ImageVariants;

  for (const format of IMAGE_FORMATS) {
    variants[format] = {} as Record<ImageWidth, string>;
    for (const width of IMAGE_WIDTHS) {
      const pipeline = base.clone().resize({ width, withoutEnlargement: true }).toColourspace("srgb");
      const body =
        format === "avif"
          ? await pipeline.avif({ quality: QUALITY.avif, effort: 4 }).toBuffer()
          : await pipeline.webp({ quality: QUALITY.webp }).toBuffer();
      const key = `${keyPrefix}-${width}.${format}`;
      variants[format][width] = key;
      files.push({ key, body, contentType: `image/${format}` });
    }
  }

  const lqipBuf = await base.clone().resize({ width: 24 }).blur(1.2).webp({ quality: 40 }).toBuffer();
  const lqip = `data:image/webp;base64,${lqipBuf.toString("base64")}`;

  // Height of the largest variant actually produced (no upscaling).
  const outWidth = Math.min(srcWidth, IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]!);
  const outHeight = Math.round((srcHeight / srcWidth) * outWidth);

  return { width: outWidth, height: outHeight, lqip, variants, files };
}

/** Long-lived immutable caching for content-addressed image keys. */
export const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
