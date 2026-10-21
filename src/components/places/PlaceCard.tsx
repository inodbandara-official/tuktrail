import { useTranslations } from "next-intl";
import type { PlaceSummary } from "@/shared/schemas/place";
import { CATEGORY_TONE } from "@/shared/design/tokens";
import { KmPost } from "../ui/KmPost";
import { Picture } from "../ui/Picture";
import { cx } from "../ui/cx";
import { CategoryIcon } from "./CategoryIcon";

const toneText = {
  laterite: "text-laterite",
  tea: "text-tea",
  ocean: "text-ocean",
  monsoon: "text-monsoon",
} as const;

export function PlaceCard({
  place,
  href,
  selected = false,
}: {
  place: PlaceSummary;
  href: string;
  selected?: boolean;
}) {
  const t = useTranslations();
  const tone = CATEGORY_TONE[place.category];
  const distance =
    place.distanceM === undefined
      ? null
      : place.distanceM < 1000
        ? t("common.mAway", { distance: Math.round(place.distanceM / 10) * 10 })
        : t("common.kmAway", { distance: (place.distanceM / 1000).toFixed(1) });

  return (
    <article
      className={cx(
        "group relative flex gap-3 rounded-lg border-2 bg-surface p-3 transition-[border-color,box-shadow] duration-150",
        selected ? "border-laterite shadow-lift" : "border-line hover:border-line-strong",
      )}
    >
      {place.heroImage ? (
        <Picture image={place.heroImage} sizes="96px" className="aspect-square w-24 shrink-0 rounded-md" />
      ) : (
        <div className="aspect-square w-24 shrink-0 rounded-md bg-surface-sunk" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p
          className={cx(
            "flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase",
            toneText[tone],
          )}
        >
          <CategoryIcon category={place.category} className="size-4" strokeWidth={2.25} />
          {t(`categories.${place.category}`)}
        </p>
        <h3 className="text-lg leading-tight">
          {/* Stretched link: the whole card is one tap target. */}
          <a
            href={href}
            className="group-has-[a:focus-visible]:outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
          >
            {place.name}
          </a>
        </h3>
        <p className="line-clamp-2 text-sm text-ink-muted">{place.shortDescription}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-semibold text-ink-muted">{t(`districts.${place.district}`)}</span>
        </div>
      </div>
      {distance && place.distanceM !== undefined && (
        <KmPost distanceM={place.distanceM} label={distance} size="sm" className="self-start" />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg group-has-[a:focus-visible]:outline-3 group-has-[a:focus-visible]:outline-offset-2 group-has-[a:focus-visible]:outline-focus"
      />
    </article>
  );
}
