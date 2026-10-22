"use client";

// MapLibre GL JS + OpenFreeMap implementation of the PlacesMap contract.
// Clustering is MapLibre's built-in GeoJSON clustering; clusters and points are rendered as
// HTML markers (real buttons) from querySourceFeatures so they stay keyboard-accessible.
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AttributionControl,
  Layer,
  Map,
  Marker,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "@vis.gl/react-maplibre";
import type { FeatureCollection, Point } from "geojson";
import { getVersion, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlaceCategory } from "@/shared/constants/places";
import { SRI_LANKA_BOUNDS } from "@/shared/constants/geography";
import { circleBbox, circlePolygon, pointsBbox, type Bbox } from "../geo";
import { ClusterPin, OriginPin, PlacePin } from "../MapPin";
import type { PlacesMapProps } from "../types";

// Bundlers can't resolve MapLibre's worker; it's served from /public (scripts/sync-map-worker.mjs).
setWorkerUrl(`/map/maplibre-gl-worker.mjs?v=${getVersion()}`);

const STYLE_URL = { light: "/map/tuktrail-light.json", dark: "/map/tuktrail-dark.json" } as const;
const SOURCE_ID = "places";
const CLUSTER_MAX_ZOOM = 13;
const FOCUS_ZOOM = CLUSTER_MAX_ZOOM + 1;
/**
 * Keep the camera near the island. Generous margins: with the bottom sheet's padding the
 * camera centre sits well south of what's visible, and tight bounds would clamp it.
 */
const MAX_BOUNDS: [number, number, number, number] = [
  SRI_LANKA_BOUNDS.west - 4,
  SRI_LANKA_BOUNDS.south - 5,
  SRI_LANKA_BOUNDS.east + 4,
  SRI_LANKA_BOUNDS.north + 3,
];

type Rendered =
  | { kind: "cluster"; key: string; clusterId: number; count: number; lng: number; lat: number }
  | {
      kind: "point";
      key: string;
      id: string;
      name: string;
      category: PlaceCategory;
      lng: number;
      lat: number;
    };

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function MapLibrePlacesMap({
  points,
  origin,
  radiusKm,
  selectedId,
  onSelect,
  focusNonce,
  frameKey,
  pickMode,
  onPick,
  colorScheme,
  insets,
  onStatusChange,
}: PlacesMapProps) {
  const t = useTranslations("map");
  const tc = useTranslations("categories");
  const mapRef = useRef<MapRef>(null);
  const [loaded, setLoaded] = useState(false);
  const [rendered, setRendered] = useState<Rendered[]>([]);

  const geojson = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        id: p.id,
        properties: { id: p.id, name: p.name, category: p.category },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      })),
    }),
    [points],
  );

  const radiusShape = useMemo(
    () => (origin && radiusKm ? circlePolygon(origin.point, radiusKm * 1000) : null),
    [origin, radiusKm],
  );

  // ── Rebuild HTML markers from what MapLibre's clusterer currently shows ──
  const raf = useRef<number | null>(null);
  const refreshMarkers = useCallback(() => {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const map = mapRef.current?.getMap();
      if (!map || !map.getSource(SOURCE_ID)) return;
      const seen = new Set<string>();
      const out: Rendered[] = [];
      for (const f of map.querySourceFeatures(SOURCE_ID)) {
        if (f.geometry.type !== "Point") continue;
        const [lng, lat] = f.geometry.coordinates as [number, number];
        const props = f.properties as Record<string, unknown>;
        if (props.cluster) {
          const key = `c${String(props.cluster_id)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            kind: "cluster",
            key,
            clusterId: Number(props.cluster_id),
            count: Number(props.point_count),
            lng,
            lat,
          });
        } else {
          const id = String(props.id);
          if (seen.has(id)) continue;
          seen.add(id);
          out.push({
            kind: "point",
            key: id,
            id,
            name: String(props.name),
            category: props.category as PlaceCategory,
            lng,
            lat,
          });
        }
      }
      setRendered(out);
    });
  }, []);

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  // Data changes → markers change once the source has re-clustered.
  useEffect(() => {
    if (loaded) refreshMarkers();
  }, [geojson, loaded, refreshMarkers]);

  // Persistent camera padding = the part of the map hidden by overlays (sheet, controls).
  // MapLibre adds it to every fitBounds/flyTo, so the "centre" is always the visible centre.
  const padding = useMemo(
    () => ({ top: insets.top + 8, bottom: insets.bottom + 8, left: insets.left, right: insets.right + 52 }),
    [insets],
  );
  const paddingRef = useRef(padding);
  useEffect(() => {
    paddingRef.current = padding;
  }, [padding]);

  // ── Frame the search area (or the results, for island-wide search) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map) return;
    let box: Bbox | null = null;
    if (origin && radiusKm) box = circleBbox(origin.point, radiusKm * 1000);
    else box = pointsBbox(points.map((p) => ({ lat: p.lat, lng: p.lng })));
    if (!box) return;
    map.fitBounds(box, { padding: 28, maxZoom: 14, duration: prefersReducedMotion() ? 0 : 700 });
    // Only re-frame when the query changes, not on every inset tweak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey, loaded]);

  // ── Pan to a place picked in the list ──
  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map || !selectedId || focusNonce === 0) return;
    const p = points.find((x) => x.id === selectedId);
    if (!p) return;
    map.flyTo({
      center: [p.lng, p.lat],
      zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
      duration: prefersReducedMotion() ? 0 : 650,
      essential: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNonce, loaded]);

  // Re-apply insets so the visible centre tracks the bottom sheet (keeps the same centre in view).
  useEffect(() => {
    if (!loaded) return;
    mapRef.current?.getMap().easeTo({ padding, duration: prefersReducedMotion() ? 0 : 250 });
  }, [padding, loaded]);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if ((e.originalEvent.target as HTMLElement | null)?.closest("[data-map-marker]")) return;
      if (pickMode) onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      else onSelect(null);
    },
    [pickMode, onPick, onSelect],
  );

  const zoomToCluster = useCallback(async (r: Extract<Rendered, { kind: "cluster" }>) => {
    const map = mapRef.current?.getMap();
    const source = map?.getSource<GeoJSONSource>(SOURCE_ID);
    if (!map || !source) return;
    const zoom = await source.getClusterExpansionZoom(r.clusterId);
    map.easeTo({ center: [r.lng, r.lat], zoom: zoom + 0.25, duration: prefersReducedMotion() ? 0 : 450 });
  }, []);

  const selected = selectedId ? points.find((p) => p.id === selectedId) : undefined;
  const lineColor = colorScheme === "dark" ? "#5CC4CC" : "#0B6670";

  return (
    <div
      className="tt-map h-full w-full"
      style={{ "--map-inset-bottom": `${insets.bottom}px` } as React.CSSProperties}
      role="region"
      aria-label={t("label")}
    >
      <Map
        ref={mapRef}
        mapStyle={STYLE_URL[colorScheme]}
        initialViewState={
          origin
            ? { longitude: origin.point.lng, latitude: origin.point.lat, zoom: 10 }
            : {
                bounds: [
                  SRI_LANKA_BOUNDS.west,
                  SRI_LANKA_BOUNDS.south,
                  SRI_LANKA_BOUNDS.east,
                  SRI_LANKA_BOUNDS.north,
                ],
              }
        }
        maxBounds={MAX_BOUNDS}
        minZoom={6}
        maxZoom={17}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        attributionControl={false}
        cursor={pickMode ? "crosshair" : undefined}
        onClick={handleClick}
        onLoad={(e) => {
          // Test/debug hook (dev only): lets e2e tests and devtools reach the map instance.
          if (process.env.NODE_ENV !== "production")
            (window as unknown as { __ttMap?: unknown }).__ttMap = e.target;
          e.target.setPadding(paddingRef.current);
          setLoaded(true);
          onStatusChange?.("ready");
        }}
        onError={(e) => {
          // Tile hiccups are routine on mobile; only a failed style load is fatal.
          if (!mapRef.current?.getMap().isStyleLoaded()) onStatusChange?.("error");
          console.warn("[map]", e.error?.message);
        }}
        onMoveEnd={refreshMarkers}
        onSourceData={(e) => {
          if (e.sourceId === SOURCE_ID && e.isSourceLoaded) refreshMarkers();
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <AttributionControl position="bottom-right" compact />
        <NavigationControl position="top-right" showCompass={false} />

        {radiusShape && (
          <Source id="radius" type="geojson" data={radiusShape}>
            <Layer id="radius-fill" type="fill" paint={{ "fill-color": lineColor, "fill-opacity": 0.05 }} />
            <Layer
              id="radius-line"
              type="line"
              paint={{
                "line-color": lineColor,
                "line-width": 2,
                "line-dasharray": [2, 2],
                "line-opacity": 0.7,
              }}
            />
          </Source>
        )}

        <Source
          id={SOURCE_ID}
          type="geojson"
          data={geojson}
          cluster
          clusterRadius={52}
          clusterMaxZoom={CLUSTER_MAX_ZOOM}
        >
          {/* Invisible layer: makes MapLibre load and cluster the source; visuals are HTML markers. */}
          <Layer id="places-hit" type="circle" paint={{ "circle-radius": 1, "circle-opacity": 0 }} />
        </Source>

        {origin && (
          <Marker
            longitude={origin.point.lng}
            latitude={origin.point.lat}
            anchor={origin.kind === "gps" ? "center" : "bottom"}
          >
            <OriginPin kind={origin.kind} label={t("yourLocation")} />
          </Marker>
        )}

        {rendered.map((r) =>
          r.kind === "cluster" ? (
            <Marker key={r.key} longitude={r.lng} latitude={r.lat} anchor="center">
              <ClusterPin
                count={r.count}
                label={t("cluster", { count: r.count })}
                onClick={() => void zoomToCluster(r)}
              />
            </Marker>
          ) : r.id === selectedId ? null : (
            <Marker key={r.key} longitude={r.lng} latitude={r.lat} anchor="center">
              <PlacePin
                category={r.category}
                name={r.name}
                label={t("marker", { name: r.name, category: tc(r.category) })}
                selected={false}
                onClick={() => onSelect(r.id)}
              />
            </Marker>
          ),
        )}

        {/* The selected place is always drawn on top, even when its neighbours are clustered. */}
        {selected && (
          <Marker longitude={selected.lng} latitude={selected.lat} anchor="center" style={{ zIndex: 5 }}>
            <PlacePin
              category={selected.category}
              name={selected.name}
              label={t("marker", { name: selected.name, category: tc(selected.category) })}
              selected
              onClick={() => onSelect(selected.id)}
            />
          </Marker>
        )}
      </Map>
    </div>
  );
}
