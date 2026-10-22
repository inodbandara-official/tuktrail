"use client";

import { Info, Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { RADIUS_OPTIONS_KM, type RadiusKm } from "@/shared/constants/places";
import { googleMapsDirectionsUrl } from "@/shared/lib/directions";
import { Link } from "@/i18n/navigation";
import { PlaceCard } from "@/components/places/PlaceCard";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/Button";
import { PlaceCardSkeleton } from "@/components/ui/Skeleton";
import { StateMessage } from "@/components/ui/StateMessage";
import type { useNearbyPlaces } from "./hooks";
import { useNearbyParams } from "./params";
import { useSelection } from "./selection";

export function NearbyList({ query }: { query: ReturnType<typeof useNearbyPlaces> }) {
  const t = useTranslations("nearby");
  const tc = useTranslations("common");
  const ts = useTranslations("states");
  const tf = useTranslations("filters");
  const [{ q, r, cat, month }, setParams] = useNearbyParams();
  const { selectedId, source, nonce, select } = useSelection();
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const sentinel = useRef<HTMLDivElement>(null);

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  // Selected on the map but not loaded yet: keep paging until it is.
  useEffect(() => {
    if (source !== "map" || !selectedId) return;
    const el = cardRefs.current.get(selectedId);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    else if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [selectedId, source, nonce, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Infinite scroll, with the button below as the accessible fallback.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-busy="true" aria-label={tc("loading")}>
        <PlaceCardSkeleton />
        <PlaceCardSkeleton />
        <PlaceCardSkeleton />
      </div>
    );
  }

  if (query.isError && items.length === 0) {
    return (
      <StateMessage
        kind="error"
        title={ts("errorTitle")}
        body={ts("errorBody")}
        action={
          <Button variant="secondary" onClick={() => void query.refetch()}>
            {tc("retry")}
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    const wider = RADIUS_OPTIONS_KM.find((km) => km > r) as RadiusKm | undefined;
    const hasFilters = cat.length > 0 || month;
    return q ? (
      <StateMessage
        kind="empty"
        title={t("emptySearchTitle", { q })}
        body={t("emptySearchBody")}
        action={
          <Button variant="secondary" onClick={() => void setParams({ q: null })}>
            {tf("clearSearch")}
          </Button>
        }
      />
    ) : (
      <StateMessage
        kind="empty"
        title={t("emptyRadiusTitle", { km: r })}
        body={t("emptyRadiusBody")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {wider && (
              <Button onClick={() => void setParams({ r: wider })}>{t("widenTo", { km: wider })}</Button>
            )}
            {hasFilters && (
              <Button variant="secondary" onClick={() => void setParams({ cat: null, month: null })}>
                {tf("clearFilters")}
              </Button>
            )}
          </div>
        }
      />
    );
  }

  return (
    <div className="p-4 pt-1">
      <ol className="flex flex-col gap-3">
        {items.map((place, i) => {
          const selected = place.id === selectedId;
          return (
            <li key={place.id}>
              <PlaceCard
                ref={(el) => {
                  if (el) cardRefs.current.set(place.id, el);
                  else cardRefs.current.delete(place.id);
                }}
                place={place}
                selected={selected}
                imagePriority={i < 2}
                onActivate={() => select(selected ? null : place.id, "list")}
                actions={
                  selected ? (
                    <>
                      <ButtonLink
                        href={googleMapsDirectionsUrl(place.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        icon={<Navigation aria-hidden className="size-5" />}
                      >
                        {tc("directions")}
                      </ButtonLink>
                      <Link href={`/places/${place.slug}`} className={buttonClasses("secondary", "md")}>
                        <Info aria-hidden className="size-5" />
                        {t("viewDetails")}
                      </Link>
                    </>
                  ) : undefined
                }
              />
            </li>
          );
        })}
      </ol>
      <div ref={sentinel} />
      {hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
            {isFetchingNextPage ? t("loadingMore") : t("loadMore")}
          </Button>
        </div>
      ) : (
        !q && <p className="mt-6 text-center text-sm text-ink-muted">{t("endOfList", { km: r })}</p>
      )}
    </div>
  );
}
