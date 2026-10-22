"use client";

import { LocateFixed, MapPin, MapPinned, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { cx } from "@/components/ui/cx";
import { useTownSearch } from "../nearby/hooks";
import { useNearbyParams } from "../nearby/params";
import { useLocationStore } from "./store";

/** Manual location fallback: GPS, town search (from our own towns table), or pick on the map. */
export function LocationPicker({
  open,
  onClose,
  onPickOnMap,
}: {
  open: boolean;
  onClose: () => void;
  onPickOnMap: () => void;
}) {
  const t = useTranslations("location");
  const tc = useTranslations("common");
  const td = useTranslations("districts");
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [, setParams] = useNearbyParams();
  const { setChoice, requestGps } = useLocationStore();
  const listId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 200);
    return () => clearTimeout(id);
  }, [q]);

  const towns = useTownSearch(debounced, open);

  const useGps = () => {
    setChoice("gps");
    requestGps();
    void setParams({ town: null, at: null });
    onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="picker-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-xl bg-surface p-0 text-ink backdrop:bg-black/55 sm:m-auto sm:max-w-md sm:rounded-xl"
    >
      <div className="flex flex-col gap-4 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-4">
          <h2 id="picker-title" className="text-2xl">
            {t("pickerTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tc("close")}
            className="tap -mt-2 -mr-2 inline-flex items-center justify-center rounded-md hover:bg-surface-sunk"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={useGps}
            className="flex min-h-12 items-center gap-2.5 rounded-md bg-laterite px-4 font-semibold text-laterite-ink"
          >
            <LocateFixed aria-hidden className="size-5" />
            {t("useMyLocation")}
          </button>
          <button
            type="button"
            onClick={() => {
              setChoice("manual");
              onPickOnMap();
            }}
            className="flex min-h-12 items-center gap-2.5 rounded-md border-2 border-line-strong px-4 font-semibold"
          >
            <MapPinned aria-hidden className="size-5" />
            {t("pickOnMap")}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="town-search" className="text-sm font-semibold">
            {t("townSearchLabel")}
          </label>
          <input
            id="town-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("townSearchPlaceholder")}
            autoComplete="off"
            aria-controls={listId}
            className="min-h-12 w-full rounded-md border-2 border-line-strong bg-bg px-4 text-base placeholder:text-ink-muted focus-visible:border-focus"
          />
          {!q && (
            <p className="text-xs font-bold tracking-wider text-ink-muted uppercase">{t("popularTowns")}</p>
          )}
          <ul
            id={listId}
            aria-live="polite"
            className={cx("flex flex-col", towns.isFetching && "opacity-70")}
          >
            {towns.data?.items.map((town) => (
              <li key={town.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setChoice("manual");
                    void setParams({ town: town.slug, at: null });
                    onClose();
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-md px-2 text-left hover:bg-surface-sunk"
                >
                  <MapPin aria-hidden className="size-5 shrink-0 text-ink-muted" />
                  <span className="font-semibold">{town.name}</span>
                  <span className="text-sm text-ink-muted">{td(town.district)}</span>
                </button>
              </li>
            ))}
            {towns.data && towns.data.items.length === 0 && (
              <li className="px-2 py-3 text-sm text-ink-muted">{t("noTowns", { q })}</li>
            )}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
