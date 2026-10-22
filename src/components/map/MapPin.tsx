import type { PlaceCategory } from "@/shared/constants/places";
import { CATEGORY_TONE } from "@/shared/design/tokens";
import { CategoryIcon } from "../places/CategoryIcon";
import { cx } from "../ui/cx";

const TONE_BG = { laterite: "bg-laterite", tea: "bg-tea", ocean: "bg-ocean", monsoon: "bg-monsoon" } as const;

/**
 * Provider-agnostic marker visuals. Real <button>s: keyboard- and screen-reader-reachable.
 * Visible disc is 34px (selected 46px); the button itself is 44px for touch.
 */
export function PlacePin({
  category,
  name,
  label,
  selected,
  onClick,
}: {
  category: PlaceCategory;
  name: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-map-marker
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className="group relative flex size-11 items-center justify-center rounded-full focus-visible:outline-offset-0"
    >
      <span
        className={cx(
          "flex items-center justify-center rounded-full border-2 border-surface text-surface shadow-lift transition-transform duration-150",
          TONE_BG[CATEGORY_TONE[category]],
          selected ? "size-11.5 scale-100 ring-3 ring-ink" : "size-8.5 group-hover:scale-110",
        )}
      >
        <CategoryIcon category={category} className={selected ? "size-5.5" : "size-4.5"} strokeWidth={2.25} />
      </span>
      {selected && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-full mt-1 max-w-48 truncate rounded-sm bg-ink px-2 py-0.5 text-xs font-bold whitespace-nowrap text-bg shadow-lift"
        >
          {name}
        </span>
      )}
    </button>
  );
}

export function ClusterPin({ count, label, onClick }: { count: number; label: string; onClick: () => void }) {
  const size = count < 10 ? "size-10" : count < 50 ? "size-12" : "size-14";
  return (
    <button
      type="button"
      data-map-marker
      aria-label={label}
      onClick={onClick}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-full"
    >
      <span
        className={cx(
          "tabular flex items-center justify-center rounded-full border-3 border-surface bg-ink font-bold text-bg shadow-lift outline-2 outline-ink/25",
          size,
        )}
      >
        {count}
      </span>
    </button>
  );
}

/** The search origin: a pulsing dot for GPS, a post-style pin for towns and map picks. */
export function OriginPin({ kind, label }: { kind: "gps" | "town" | "pin" | "default"; label: string }) {
  if (kind === "gps") {
    return (
      <span role="img" aria-label={label} className="relative flex size-6 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full bg-ocean/35 motion-reduce:hidden"
        />
        <span aria-hidden className="size-4 rounded-full border-3 border-surface bg-ocean shadow-lift" />
      </span>
    );
  }
  return (
    <span role="img" aria-label={label} className="flex flex-col items-center">
      <span
        aria-hidden
        className="flex h-6 w-5 flex-col overflow-hidden rounded-t-full rounded-b-sm border-2 border-ink bg-surface shadow-lift"
      >
        <span className="h-2 bg-laterite" />
      </span>
      <span aria-hidden className="h-2 w-0.5 bg-ink" />
    </span>
  );
}
