"use client";

import { useEffect, useRef, useState } from "react";
import type { MapPoint } from "@/shared/schemas/nearby";
import { PlacesMap } from "@/components/map/PlacesMap";
import { useColorScheme } from "@/components/theme/useColorScheme";

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const noop = () => undefined;

/** Small locator map. Mounted only when scrolled near, so map JS never delays first paint. */
export function PlaceMiniMap({ point }: { point: MapPoint }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-60 overflow-hidden rounded-lg border-2 border-line bg-surface-sunk">
      {visible && (
        <PlacesMap
          points={[point]}
          origin={null}
          radiusKm={null}
          selectedId={point.id}
          onSelect={noop}
          focusNonce={0}
          frameKey={point.id}
          pickMode={false}
          onPick={noop}
          colorScheme={scheme}
          insets={NO_INSETS}
          frameMaxZoom={11}
        />
      )}
    </div>
  );
}
