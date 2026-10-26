// Next-only glue: after admin changes, drop cached place pages so the next visit shows them.
import { revalidateTag } from "next/cache";

/** `expire: 0` — the next request re-renders instead of being served the stale page. */
export function revalidatePlace(...slugs: (string | null | undefined)[]) {
  revalidateTag("places", { expire: 0 });
  for (const slug of new Set(slugs)) if (slug) revalidateTag(`place:${slug}`, { expire: 0 });
}
