"use client";

import { LocateFixed, MapPin, MapPinned, WifiOff, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { PlacesMap, type MapInsets } from "@/components/map/PlacesMap";
import { useColorScheme } from "@/components/theme/useColorScheme";
import { BottomSheet, type Snap } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { roundCoord } from "@/shared/schemas/nearby";
import { LocationExplainer } from "../location/LocationExplainer";
import { LocationPicker } from "../location/LocationPicker";
import { FilterBar } from "./FilterBar";
import { useMapPoints, useNearbyPlaces, useNearbyQueryParams, useOnline, useOrigin } from "./hooks";
import { NearbyList } from "./NearbyList";
import { useNearbyParams } from "./params";
import { useSelection } from "./selection";

const DESKTOP = "(min-width: 64rem)";
const subscribeDesktop = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useIsDesktop = () =>
  useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );

const HANDLE_H = 44;

export function NearbyScreen() {
  const t = useTranslations("nearby");
  const tl = useTranslations("location");
  const tc = useTranslations("common");
  const tf = useTranslations("filters");

  const originState = useOrigin();
  const origin = originState.status === "ready" ? originState.origin : null;
  const params = useNearbyQueryParams(origin);
  const list = useNearbyPlaces(params);
  const points = useMapPoints(params);
  const [{ q, r }, setParams] = useNearbyParams();
  const { selectedId, nonce, source, select } = useSelection();
  const scheme = useColorScheme();
  const online = useOnline();
  const isDesktop = useIsDesktop();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [snap, setSnap] = useState<Snap>("half");

  // ── Measure the area and the sheet header to derive snap heights ──
  const areaRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [areaH, setAreaH] = useState(700);
  const [headerH, setHeaderH] = useState(180);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      if (areaRef.current) setAreaH(areaRef.current.clientHeight);
      if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
    });
    if (areaRef.current) ro.observe(areaRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  const heights = useMemo(() => {
    const peek = Math.min(HANDLE_H + headerH + 4, areaH - 120);
    const full = Math.max(peek + 80, areaH - 56);
    const half = Math.min(full - 40, Math.max(peek + 160, Math.round(areaH * 0.55)));
    return { peek, half, full };
  }, [areaH, headerH]);

  const insets = useMemo<MapInsets>(
    () =>
      isDesktop
        ? { top: 0, right: 0, bottom: 0, left: 0 }
        : { top: 0, right: 0, bottom: snap === "full" ? heights.half : heights[snap], left: 0 },
    [isDesktop, snap, heights],
  );

  // New query → clear a selection that may no longer be in the results.
  const queryKey = JSON.stringify(params);
  useEffect(() => {
    select(null, "list");
  }, [queryKey, select]);

  const onPick = useCallback(
    (p: { lat: number; lng: number }) => {
      setPickMode(false);
      void setParams({ at: { lat: roundCoord(p.lat), lng: roundCoord(p.lng) }, town: null });
    },
    [setParams],
  );

  const total = list.data?.pages[0]?.total;
  const pointIds = points.data?.items.map((p) => p.id).join(",") ?? "";
  // Radius search frames the circle; text search frames the results once they arrive.
  const frameKey = q
    ? `q:${q}:${pointIds}`
    : origin
      ? `r:${origin.point.lat},${origin.point.lng},${r}`
      : "island";

  const originLabel =
    origin?.kind === "gps"
      ? tl("nearYou")
      : origin?.kind === "town"
        ? tl("nearTown", { town: origin.label ?? "" })
        : origin?.kind === "pin"
          ? tl("nearPin")
          : origin
            ? tl("nearDefault")
            : tl("locating");

  const header = (
    <div ref={headerRef}>
      <FilterBar />
      <div className="flex min-h-11 items-center gap-2 border-t-2 border-line px-4 py-1.5">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold" aria-live="polite">
          {total === undefined
            ? tc("loading")
            : q
              ? t("countSearch", { count: total, q })
              : t("count", { count: total, km: r })}
        </p>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label={`${originLabel}. ${tl("change")}`}
          className="inline-flex min-h-11 max-w-[55%] items-center gap-1.5 rounded-full px-2 text-sm font-bold text-ocean hover:bg-ocean-soft"
        >
          {origin?.kind === "gps" ? (
            <LocateFixed aria-hidden className="size-4 shrink-0" />
          ) : (
            <MapPin aria-hidden className="size-4 shrink-0" />
          )}
          <span className="truncate underline decoration-2 underline-offset-4">{originLabel}</span>
        </button>
      </div>
      {!online && (
        <p
          role="status"
          className="mx-4 mb-2 flex items-center gap-2 rounded-md bg-warn-soft px-3 py-2 text-sm text-warn"
        >
          <WifiOff aria-hidden className="size-4 shrink-0" />
          <span>
            <strong>{tc("offline")}.</strong> {tc("offlineHint")}
          </span>
        </p>
      )}
    </div>
  );

  const needsChoice = originState.status === "needs-choice";

  return (
    <div
      ref={areaRef}
      className="relative h-[calc(100dvh-4rem)] overflow-hidden lg:grid lg:grid-cols-[26rem_1fr]"
    >
      <div inert={needsChoice} className="contents">
        <div className="absolute inset-0 lg:relative lg:col-start-2 lg:row-start-1">
          <PlacesMap
            points={points.data?.items ?? []}
            origin={origin}
            radiusKm={q ? null : r}
            selectedId={selectedId}
            onSelect={(id) => {
              select(id, "map");
              // Marker tapped with the sheet tucked away: bring the card into view.
              if (id && !isDesktop && snap === "peek") setSnap("half");
            }}
            focusNonce={source === "list" ? nonce : 0}
            frameKey={frameKey}
            pickMode={pickMode}
            onPick={onPick}
            colorScheme={scheme}
            insets={insets}
          />
          {pickMode && (
            <div className="absolute top-0 right-16 left-0 z-10 flex justify-start p-3 lg:right-0 lg:justify-center">
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border-2 border-ink bg-ink py-1 pr-1 pl-3 text-sm font-bold text-bg shadow-lift"
              >
                <MapPinned aria-hidden className="size-4" />
                {tl("pickModeHint")}
                <button
                  type="button"
                  onClick={() => setPickMode(false)}
                  aria-label={tl("cancel")}
                  className="tap inline-flex items-center justify-center rounded-full hover:bg-bg/15"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <BottomSheet
          snap={snap}
          onSnapChange={setSnap}
          heights={heights}
          header={header}
          label={t("listLabel")}
          handleLabel={t("sheetHandle")}
          expandLabel={t("sheetExpand")}
          collapseLabel={t("sheetCollapse")}
          className="lg:col-start-1 lg:row-start-1 lg:min-h-0"
        >
          {originState.status === "ready" && originState.notice && (
            <div role="status" className="mx-4 mt-3 rounded-md bg-surface-sunk p-3 text-sm">
              <p className="font-bold">{tl("deniedTitle")}</p>
              <p className="mt-0.5 text-ink-muted">
                {originState.notice === "denied" ? tl("deniedBody") : tl("unavailableBody")}
              </p>
              <Button variant="quiet" className="-ml-1" onClick={() => setPickerOpen(true)}>
                {tl("chooseTown")}
              </Button>
            </div>
          )}
          {/* Until an origin resolves the query is disabled and stays "pending" → skeletons. */}
          <NearbyList query={list} />
        </BottomSheet>
      </div>

      {needsChoice && <LocationExplainer onChooseTown={() => setPickerOpen(true)} />}

      <LocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPickOnMap={() => {
          setPickerOpen(false);
          setPickMode(true);
          select(null, "list");
          if (!isDesktop) setSnap("peek");
        }}
      />
      <span className="sr-only" aria-live="polite">
        {q ? tf("searchingIsland") : ""}
      </span>
    </div>
  );
}
