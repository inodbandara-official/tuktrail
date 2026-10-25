import { useTranslations } from "next-intl";
import type { PlaceImage } from "@/shared/schemas/place";
import { cx } from "@/components/ui/cx";

/**
 * Attribution required by CC BY / BY-SA and good practice for everything else:
 * author, licence (linked to its deed) and a link to the source page.
 */
export function PhotoCredit({
  image,
  className,
  tone = "page",
}: {
  image: PlaceImage;
  className?: string;
  tone?: "page" | "dark";
}) {
  const t = useTranslations("place");
  if (!image.attribution) return null;
  const link =
    tone === "dark"
      ? "text-white underline underline-offset-2"
      : "text-ink-muted underline underline-offset-2";
  return (
    <p className={cx("text-xs", tone === "dark" ? "text-white/75" : "text-ink-muted", className)}>
      {image.sourceUrl ? (
        <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className={link}>
          {t("photoCredit", { credit: image.attribution })}
        </a>
      ) : (
        t("photoCredit", { credit: image.attribution })
      )}
      {image.license && (
        <>
          {" · "}
          {image.licenseUrl ? (
            <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer license" className={link}>
              {image.license}
            </a>
          ) : (
            image.license
          )}
        </>
      )}
    </p>
  );
}
