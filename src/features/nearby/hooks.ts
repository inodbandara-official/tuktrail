"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { LatLng } from "@/shared/schemas/common";
import {
  mapPointsResponseSchema,
  nearbyResponseSchema,
  townSchema,
  townsResponseSchema,
} from "@/shared/schemas/nearby";
import type { OriginKind } from "@/components/map/types";
import { apiGet } from "../api/client";
import { DEFAULT_ORIGIN, useLocationStore } from "../location/store";
import { colomboMonth, useNearbyParams } from "./params";

export interface ResolvedOrigin {
  point: LatLng;
  kind: OriginKind;
  /** Town name for "Near Kandy". */
  label?: string;
}

export type OriginState =
  | { status: "pending" } // storage not read yet, or waiting for GPS / town lookup
  | { status: "needs-choice" } // first visit: show the explainer
  | { status: "ready"; origin: ResolvedOrigin; notice?: "denied" | "unavailable" };

/** Resolves where "nearby" is measured from: map pick > town > GPS > Colombo. */
export function useOrigin(): OriginState {
  const [{ at, town }] = useNearbyParams();
  const { hydrated, hydrate, choice, gps, gpsStatus } = useLocationStore();

  useEffect(() => hydrate(), [hydrate]);

  const townQuery = useQuery({
    queryKey: ["town", town],
    queryFn: ({ signal }) => apiGet(`/towns/${encodeURIComponent(town!)}`, {}, townSchema, signal),
    enabled: !!town && !at,
    staleTime: Infinity,
    retry: 1,
  });

  return useMemo<OriginState>(() => {
    if (at) return { status: "ready", origin: { point: at, kind: "pin" } };
    if (town) {
      if (townQuery.data) {
        return {
          status: "ready",
          origin: {
            point: { lat: townQuery.data.lat, lng: townQuery.data.lng },
            kind: "town",
            label: townQuery.data.name,
          },
        };
      }
      if (townQuery.isError) return { status: "ready", origin: { point: DEFAULT_ORIGIN, kind: "default" } };
      return { status: "pending" };
    }
    if (!hydrated) return { status: "pending" };
    if (choice === "gps") {
      if (gps) return { status: "ready", origin: { point: gps, kind: "gps" } };
      if (gpsStatus === "denied" || gpsStatus === "unavailable") {
        return { status: "ready", origin: { point: DEFAULT_ORIGIN, kind: "default" }, notice: gpsStatus };
      }
      return { status: "pending" };
    }
    if (choice === "manual") return { status: "ready", origin: { point: DEFAULT_ORIGIN, kind: "default" } };
    return { status: "needs-choice" };
  }, [at, town, townQuery.data, townQuery.isError, hydrated, choice, gps, gpsStatus]);
}

/** Query parameters shared by the list and the map. */
export function useNearbyQueryParams(origin: ResolvedOrigin | null) {
  const [{ cat, month, q, r }] = useNearbyParams();
  return useMemo(
    () =>
      origin
        ? {
            lat: origin.point.lat,
            lng: origin.point.lng,
            radius_km: r,
            category: cat,
            month: month ? colomboMonth() : undefined,
            q: q.trim() || undefined,
          }
        : null,
    [origin, cat, month, q, r],
  );
}

type QueryParams = NonNullable<ReturnType<typeof useNearbyQueryParams>>;

export function useNearbyPlaces(params: QueryParams | null) {
  return useInfiniteQuery({
    queryKey: ["nearby", params],
    enabled: !!params,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      apiGet("/places/nearby", { ...params!, cursor: pageParam, limit: 20 }, nearbyResponseSchema, signal),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });
}

export function useMapPoints(params: QueryParams | null) {
  return useQuery({
    queryKey: ["points", params],
    enabled: !!params,
    queryFn: ({ signal }) => apiGet("/places/points", params!, mapPointsResponseSchema, signal),
    placeholderData: keepPreviousData,
  });
}

export function useTownSearch(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ["towns", q],
    enabled,
    queryFn: ({ signal }) => apiGet("/towns", { q: q.trim() || undefined }, townsResponseSchema, signal),
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
  });
}

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}
