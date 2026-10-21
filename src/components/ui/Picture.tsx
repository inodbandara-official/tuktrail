import type { PlaceImage } from "@/shared/schemas/place";
import { cx } from "./cx";

/**
 * Responsive AVIF/WebP picture from pre-generated variants (no runtime optimiser needed).
 * The LQIP is painted as a background so slow connections see colour and shape immediately.
 */
export function Picture({
  image,
  sizes,
  priority = false,
  className,
  imgClassName,
}: {
  image: PlaceImage;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const srcset = (format: "avif" | "webp") =>
    image.sources
      .filter((s) => s.format === format)
      .map((s) => `${s.url} ${s.width}w`)
      .join(", ");
  const fallback = image.sources.find((s) => s.format === "webp" && s.width === 800) ?? image.sources[0];

  return (
    <picture className={cx("block overflow-hidden", className)}>
      <source type="image/avif" srcSet={srcset("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset("webp")} sizes={sizes} />
      <img
        src={fallback?.url}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={cx("h-full w-full bg-cover bg-center object-cover dark:brightness-[.88]", imgClassName)}
        style={{ backgroundImage: `url("${image.lqip}")` }}
      />
    </picture>
  );
}
