import { HOW_TO_GET_THERE } from "./access";
import { COORD_OVERRIDES } from "./coord-overrides";
import { SEED_PLACES as BASE_PLACES, type SeedPlace } from "./places";
import { SEED_PLACES_EXTRA } from "./places-extra";
import { SEED_PLACES_MORE } from "./places-more";

/** Every seed place, with access notes and sourced coordinate corrections applied. */
export const ALL_SEED_PLACES: SeedPlace[] = [...BASE_PLACES, ...SEED_PLACES_MORE, ...SEED_PLACES_EXTRA].map(
  (p) => {
    const fix = COORD_OVERRIDES[p.slug];
    return {
      ...p,
      howToGetThere: p.howToGetThere ?? HOW_TO_GET_THERE[p.slug],
      ...(fix ? { lat: fix.lat, lng: fix.lng, checkCoords: false } : {}),
    };
  },
);
