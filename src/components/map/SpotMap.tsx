"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { SpotMapProps } from "./types";

function Loading() {
  const t = useTranslations("map");
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-sunk" role="status">
      <span className="animate-pulse text-sm font-semibold text-ink-muted">{t("loading")}</span>
    </div>
  );
}

// Provider implementation, loaded client-side after first paint (see PlacesMap for the pattern).
const Impl = dynamic(() => import("./maplibre/MapLibreSpotMap"), { ssr: false, loading: Loading });

export function SpotMap(props: SpotMapProps) {
  return (
    <div className="relative h-full w-full bg-surface-sunk">
      <Impl {...props} />
    </div>
  );
}
