"use client";

import { LocateFixed } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { LatLng } from "@/shared/schemas/common";
import { formatDistance, haversineM } from "@/shared/lib/geo";
import { KmPost } from "@/components/ui/KmPost";
import { useLocationStore } from "../location/store";

/**
 * Distance from the user's last (rounded, session-only) GPS fix. Computed in the browser:
 * the detail page never sends the user's location anywhere.
 */
export function DistanceFromYou({ place }: { place: LatLng }) {
  const t = useTranslations("place");
  const tc = useTranslations("common");
  const { hydrate, gps, gpsStatus, setChoice, requestGps } = useLocationStore();
  useEffect(() => hydrate(), [hydrate]);

  if (gps) {
    const m = haversineM(gps, place);
    const { value, unit } = formatDistance(m);
    const label = t("distanceFromYou", {
      distance: unit === "m" ? tc("mAway", { distance: value }) : tc("kmAway", { distance: value }),
    });
    return (
      <div className="flex items-center gap-3">
        <KmPost distanceM={m} label={label} />
        <span className="text-sm font-semibold text-ink-muted" aria-hidden>
          {label}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={gpsStatus === "locating"}
      onClick={() => {
        setChoice("gps");
        requestGps();
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 font-semibold text-ocean underline decoration-2 underline-offset-4 disabled:opacity-60"
    >
      <LocateFixed aria-hidden className="size-5" />
      {gpsStatus === "locating" ? t("locating") : t("showDistance")}
    </button>
  );
}
