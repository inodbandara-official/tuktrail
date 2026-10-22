// Cached, Next-specific accessors for place pages. Tags let admin edits (Phase 5) revalidate.
import { cacheLife, cacheTag } from "next/cache";
import { getPlaceDetail, listPublishedSlugs } from "../services/places";
import { createCtx } from "./ctx";

export async function getCachedPlace(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("places", `place:${slug}`);
  return getPlaceDetail(createCtx(), slug);
}

export async function getCachedSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag("places");
  return listPublishedSlugs(createCtx());
}
