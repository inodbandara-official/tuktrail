"use client";

import { CalendarCheck, ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PLACE_CATEGORIES, RADIUS_OPTIONS_KM, type RadiusKm } from "@/shared/constants/places";
import { CategoryIcon } from "@/components/places/CategoryIcon";
import { Chip } from "@/components/ui/Chip";
import { cx } from "@/components/ui/cx";
import { colomboMonth, useNearbyParams } from "./params";

export function FilterBar() {
  const t = useTranslations("filters");
  const tc = useTranslations("categories");
  const tm = useTranslations("months");
  const [{ cat, month, q, r }, setParams] = useNearbyParams();

  // Debounce typing into the URL (and therefore into queries).
  const [text, setText] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    // URL changed elsewhere (back button, clear): adopt it.
    setLastQ(q);
    setText(q);
  }
  useEffect(() => {
    if (text === q) return;
    const id = setTimeout(() => void setParams({ q: text.trim() ? text : null }), 300);
    return () => clearTimeout(id);
  }, [text, q, setParams]);

  const toggleCat = (c: (typeof PLACE_CATEGORIES)[number]) =>
    void setParams({ cat: cat.includes(c) ? cat.filter((x) => x !== c) : [...cat, c] });

  const searching = q.trim().length > 0;

  return (
    <div className="flex flex-col gap-2.5 px-4 pb-2 lg:pt-4">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
        <label htmlFor="nearby-search" className="sr-only">
          {t("searchLabel")}
        </label>
        <input
          id="nearby-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-12 w-full rounded-md border-2 border-line-strong bg-bg pr-12 pl-4 text-base text-ink placeholder:text-ink-muted focus-visible:border-focus [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            onClick={() => {
              setText("");
              void setParams({ q: null });
            }}
            aria-label={t("clearSearch")}
            className="tap absolute top-1/2 right-0.5 inline-flex -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:text-ink"
          >
            <X aria-hidden className="size-5" />
          </button>
        )}
      </form>

      <div
        data-no-drag
        role="group"
        aria-label={t("categories")}
        className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 lg:flex-wrap lg:gap-1.5 lg:overflow-visible lg:[&>*]:min-h-9 lg:[&>*]:text-[0.875rem]"
      >
        <label
          className={cx(
            "relative inline-flex min-h-11 shrink-0 items-center rounded-full border-2 border-line-strong bg-surface pr-8 pl-3.5 text-sm font-semibold has-[select:focus-visible]:outline-3 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-focus",
            searching && "opacity-60",
          )}
          title={searching ? t("searchingIsland") : undefined}
        >
          <span className="sr-only">{t("radius")}</span>
          <select
            value={r}
            disabled={searching}
            onChange={(e) => void setParams({ r: Number(e.target.value) as RadiusKm })}
            className="appearance-none bg-transparent pr-1 outline-none focus-visible:outline-none"
          >
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>
                {t("radiusOption", { km })}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 size-4" />
        </label>

        <Chip
          pressed={month}
          onClick={() => void setParams({ month: !month })}
          icon={<CalendarCheck aria-hidden className="size-4" />}
        >
          {t("goodThisMonth", { month: tm(String(colomboMonth())) })}
        </Chip>

        {PLACE_CATEGORIES.filter((c) => c !== "other").map((c) => (
          <Chip
            key={c}
            pressed={cat.includes(c)}
            onClick={() => toggleCat(c)}
            icon={<CategoryIcon category={c} className="size-4" />}
          >
            {tc(c)}
          </Chip>
        ))}
      </div>
    </div>
  );
}
