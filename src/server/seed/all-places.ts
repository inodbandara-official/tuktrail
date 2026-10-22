import { HOW_TO_GET_THERE } from "./access";
import { SEED_PLACES as BASE_PLACES, type SeedPlace } from "./places";
import { SEED_PLACES_MORE } from "./places-more";

/** Every seed place, with access notes resolved. */
export const ALL_SEED_PLACES: SeedPlace[] = [...BASE_PLACES, ...SEED_PLACES_MORE].map((p) => ({
  ...p,
  howToGetThere: p.howToGetThere ?? HOW_TO_GET_THERE[p.slug],
}));
