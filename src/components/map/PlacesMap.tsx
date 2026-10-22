"use client";

// The only map entry point the app uses. To change provider, point the dynamic import
// at another implementation of PlacesMapProps (see ./types.ts).
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { StateMessage } from "../ui/StateMessage";
import type { PlacesMapProps } from "./types";

function MapLoading() {
  const t = useTranslations("map");
  return (
    <div className="flex h-full w-full items-start justify-center bg-surface-sunk pt-24" role="status">
      <span className="animate-pulse text-sm font-semibold text-ink-muted">{t("loading")}</span>
    </div>
  );
}

// Map JS is heavy: load it after first paint, client-only.
const Impl = dynamic(() => import("./maplibre/MapLibrePlacesMap"), { ssr: false, loading: MapLoading });

export function PlacesMap(props: Omit<PlacesMapProps, "onStatusChange">) {
  const t = useTranslations("map");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  return (
    <div className="relative h-full w-full bg-surface-sunk">
      <Impl {...props} onStatusChange={setStatus} />
      {status === "error" && (
        <div className="absolute inset-x-0 top-0 flex justify-center p-4">
          <div className="max-w-sm rounded-lg border-2 border-line bg-surface shadow-lift">
            <StateMessage
              kind="offline"
              title={t("unavailableTitle")}
              body={t("unavailableBody")}
              className="py-6"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export type { PlacesMapProps, MapInsets, OriginKind } from "./types";
