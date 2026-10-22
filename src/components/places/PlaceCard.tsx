import { useTranslations } from "next-intl";
import type { ReactNode, Ref } from "react";
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

type Activation =
  /** Whole card links somewhere. */
  | { href: string; onActivate?: never }
  /** Whole card is a toggle button (e.g. select on the map); `actions` appear when selected. */
  | { onActivate: () => void; href?: never };

export function PlaceCard({
  place,
  selected = false,
  actions,
  imagePriority = false,
  ref,
  ...activation
}: {
  place: PlaceSummary;
  selected?: boolean;
  actions?: ReactNode;
  imagePriority?: boolean;
  ref?: Ref<HTMLElement>;
} & Activation) {
  const t = useTranslations();
  const tone = CATEGORY_TONE[place.category];
  const distance =
    place.distanceM === undefined
      ? null
      : place.distanceM < 1000
        ? t("common.mAway", { distance: Math.round(place.distanceM / 10) * 10 })
        : t("common.kmAway", { distance: (place.distanceM / 1000).toFixed(1) });

  // Stretched control: the whole card is one tap target; actions sit above it (z-10).
  const stretched =
    "text-left after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none";

  return (
    <article
      ref={ref}
      className={cx(
        "group relative rounded-lg border-2 bg-surface p-3 transition-[border-color,box-shadow] duration-150",
        selected ? "border-laterite shadow-lift" : "border-line hover:border-line-strong",
      )}
    >
      <div className="flex gap-3">
        {place.heroImage ? (
          <Picture
            image={place.heroImage}
            sizes="96px"
            priority={imagePriority}
            className="aspect-square w-24 shrink-0 rounded-md"
          />
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
            {activation.href !== undefined ? (
              <a href={activation.href} className={stretched}>
                {place.name}
              </a>
            ) : (
              <button
                type="button"
                onClick={activation.onActivate}
                aria-pressed={selected}
                className={stretched}
              >
                {place.name}
              </button>
            )}
          </h3>
          <p className="line-clamp-2 text-sm text-ink-muted">{place.shortDescription}</p>
          <p className="mt-auto pt-1 text-xs font-semibold text-ink-muted">
            {t(`districts.${place.district}`)}
          </p>
        </div>
        {distance && place.distanceM !== undefined && (
          <KmPost distanceM={place.distanceM} label={distance} size="sm" className="self-start" />
        )}
      </div>
      {actions && <div className="relative z-10 mt-3 flex flex-wrap gap-2">{actions}</div>}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg group-has-[h3_:focus-visible]:outline-3 group-has-[h3_:focus-visible]:outline-offset-2 group-has-[h3_:focus-visible]:outline-focus"
      />
    </article>
  );
}
