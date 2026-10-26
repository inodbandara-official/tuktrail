"use client";

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
import { getVersion, setWorkerUrl } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { SRI_LANKA_BOUNDS } from "@/shared/constants/geography";
import { circleBbox, circlePolygon } from "../geo";
import type { SpotMapProps } from "../types";

setWorkerUrl(`/map/maplibre-gl-worker.mjs?v=${getVersion()}`);

const STYLE_URL = { light: "/map/tuktrail-light.json", dark: "/map/tuktrail-dark.json" } as const;
const PADDING = 36;

export default function MapLibreSpotMap({
  center,
  radiusM,
  compare,
  editable = false,
  onChange,
  frameKey,
  colorScheme,
  labels,
}: SpotMapProps) {
  const mapRef = useRef<MapRef>(null);
  const circle = useMemo(() => circlePolygon(center, radiusM), [center, radiusM]);
  const lineColor = colorScheme === "dark" ? "#5CC4CC" : "#0B6670";

  const bounds = useMemo((): [number, number, number, number] => {
    const [w, s, e, n] = circleBbox(center, radiusM);
    if (!compare) return [w, s, e, n];
    return [
      Math.min(w, compare.lng),
      Math.min(s, compare.lat),
      Math.max(e, compare.lng),
      Math.max(n, compare.lat),
    ];
    // Only re-frame on frameKey (not on every drag of the pin).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey]);

  useEffect(() => {
    mapRef.current?.fitBounds(bounds, { padding: PADDING, maxZoom: 16, duration: 400 });
  }, [bounds]);

  const move = (e: MapLayerMouseEvent) => {
    if (!editable || !onChange) return;
    if ((e.originalEvent.target as HTMLElement | null)?.closest("[data-map-marker]")) return;
    onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  };

  return (
    <div className="tt-map h-full w-full" role="region" aria-label={labels.region}>
      <Map
        ref={mapRef}
        mapStyle={STYLE_URL[colorScheme]}
        initialViewState={{ bounds, fitBoundsOptions: { padding: PADDING, maxZoom: 16 } }}
        maxBounds={[
          SRI_LANKA_BOUNDS.west - 2,
          SRI_LANKA_BOUNDS.south - 2,
          SRI_LANKA_BOUNDS.east + 2,
          SRI_LANKA_BOUNDS.north + 2,
        ]}
        minZoom={6}
        maxZoom={18}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        cooperativeGestures={!editable}
        attributionControl={false}
        cursor={editable ? "crosshair" : undefined}
        onClick={move}
        style={{ width: "100%", height: "100%" }}
      >
        <AttributionControl position="bottom-right" compact />
        <NavigationControl position="top-right" showCompass={false} />
        <Source id="spot-radius" type="geojson" data={circle}>
          <Layer
            id="spot-radius-fill"
            type="fill"
            paint={{ "fill-color": lineColor, "fill-opacity": 0.08 }}
          />
          <Layer
            id="spot-radius-line"
            type="line"
            paint={{ "line-color": lineColor, "line-width": 2, "line-dasharray": [2, 2] }}
          />
        </Source>
        {compare && (
          <Marker longitude={compare.lng} latitude={compare.lat} anchor="center">
            <span
              role="img"
              aria-label={labels.compare}
              className="block size-5 rounded-full border-3 border-surface bg-laterite shadow-lift"
            />
          </Marker>
        )}
        <Marker
          longitude={center.lng}
          latitude={center.lat}
          anchor="bottom"
          draggable={editable}
          onDragEnd={(e) => onChange?.({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
        >
          <span
            data-map-marker
            role="img"
            aria-label={labels.pin}
            className={
              editable
                ? "flex cursor-grab flex-col items-center active:cursor-grabbing"
                : "flex flex-col items-center"
            }
          >
            <span
              aria-hidden
              className="flex h-8 w-6.5 flex-col overflow-hidden rounded-t-full rounded-b-sm border-2 border-ink bg-surface shadow-lift"
            >
              <span className="h-2.5 bg-ocean" />
            </span>
            <span aria-hidden className="h-2.5 w-0.5 bg-ink" />
          </span>
        </Marker>
      </Map>
    </div>
  );
}
