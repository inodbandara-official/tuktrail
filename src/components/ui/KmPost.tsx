import { cx } from "./cx";

/**
 * Distance marker styled after Sri Lanka's roadside kilometre posts:
 * a pale slab with a rounded, coloured cap and big tabular numerals.
 * `distanceM` in metres; under 1 km shows metres.
 */
export function KmPost({
  distanceM,
  label,
  size = "md",
  className,
}: {
  distanceM: number;
  /** Accessible text, e.g. "2.4 km away" (already localised). */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const km = distanceM / 1000;
  const value =
    distanceM < 1000
      ? String(Math.round(distanceM / 10) * 10)
      : km < 10
        ? km.toFixed(1)
        : String(Math.round(km));
  const unit = distanceM < 1000 ? "m" : "km";

  return (
    <span
      role="img"
      aria-label={label}
      className={cx(
        "tabular inline-flex flex-col items-stretch overflow-hidden rounded-t-[999px] rounded-b-sm border-2 border-line-strong bg-surface text-center leading-none",
        size === "sm" ? "w-12" : "w-15",
        className,
      )}
    >
      <span aria-hidden className={cx("bg-laterite", size === "sm" ? "h-2.5" : "h-3.5")} />
      <span aria-hidden className={cx("px-1 pt-1 font-bold text-ink", size === "sm" ? "text-sm" : "text-lg")}>
        {value}
      </span>
      <span
        aria-hidden
        className="pb-1 text-[0.6875rem] font-semibold tracking-wider text-ink-muted uppercase"
      >
        {unit}
      </span>
    </span>
  );
}
