/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Wikimedia API responses, read defensively below */
// Finds one freely licensed, place-specific photo per seed place on Wikimedia Commons and
// cross-checks our coordinates against Wikidata.
//
//   pnpm photos:fetch [slug…] [--refresh]
//     → writes src/server/seed/photos.json (committed metadata)
//     → downloads ≤1600px renditions to .cache/place-photos/ (gitignored)
//
// Source preference: the Wikidata item's curated image (P18), the Wikipedia article's lead
// image, then large landscape photos from the item's Commons category (P373).
// Only CC0 / CC BY / CC BY-SA / Free Art License / public-domain files are accepted.
// The seed later strips metadata, resizes and self-hosts them — nothing is hotlinked.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { ALL_SEED_PLACES } from "../src/server/seed/all-places";
import { WIKI_TITLES } from "../src/server/seed/wiki-titles";
import { haversineM } from "../src/shared/lib/geo";
import { PHOTO_REJECTIONS } from "../src/server/seed/photo-rejections";
import { isFreeLicense, type PhotoEntry } from "../src/server/seed/photos";

const UA = "TukTrail/0.1 (seed script for an open travel-guide prototype; Wikimedia API etiquette: 1 req/s)";
const CACHE = ".cache/place-photos";
const OUT = "src/server/seed/photos.json";
const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("--"));
const refresh = args.includes("--refresh");

const normalise = (t: string) =>
  t
    .replace(/^File:/, "")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase();
const rejectedFiles = new Set(Object.values(PHOTO_REJECTIONS).flatMap((r) => r.files.map(normalise)));

// ── polite HTTP: ~1 request/second, honour Retry-After on 429 ─────────────
let lastRequest = 0;
async function politeFetch(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const wait = lastRequest + 1000 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();
    const res = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get("retry-after")) || 5 * (attempt + 1);
      console.warn(`  … ${res.status}, waiting ${retryAfter}s`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }
    return res;
  }
  throw new Error(`Gave up after retries: ${url}`);
}

async function getJson(base: string, params: Record<string, string>): Promise<any> {
  const res = await politeFetch(`${base}?${new URLSearchParams({ format: "json", ...params })}`);
  if (!res.ok) throw new Error(`${res.status} ${base}`);
  return res.json();
}

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

async function wikipedia(title: string) {
  const j = await getJson("https://en.wikipedia.org/w/api.php", {
    action: "query",
    redirects: "1",
    titles: title,
    prop: "pageprops|pageimages",
    piprop: "name",
    pilicense: "free",
  });
  const page = Object.values(j.query?.pages ?? {})[0] as any;
  if (!page || "missing" in page) return null;
  return {
    qid: page.pageprops?.wikibase_item as string | undefined,
    lead: page.pageimage as string | undefined,
  };
}

async function wikidata(qid: string) {
  const j = await getJson("https://www.wikidata.org/w/api.php", {
    action: "wbgetentities",
    props: "claims",
    ids: qid,
  });
  const claims = j.entities?.[qid]?.claims ?? {};
  const value = (p: string) => claims[p]?.[0]?.mainsnak?.datavalue?.value;
  const coord = value("P625") as { latitude: number; longitude: number } | undefined;
  return {
    image: value("P18") as string | undefined,
    category: value("P373") as string | undefined,
    coords: coord ? { lat: coord.latitude, lng: coord.longitude } : null,
  };
}

async function categoryFiles(category: string): Promise<string[]> {
  const j = await getJson("https://commons.wikimedia.org/w/api.php", {
    action: "query",
    list: "categorymembers",
    cmtitle: `Category:${category}`,
    cmtype: "file",
    cmlimit: "20",
  });
  return ((j.query?.categorymembers ?? []) as { title: string }[])
    .map((m) => m.title)
    .filter((t) => /\.(jpe?g|png|webp)$/i.test(t));
}

/** Full-text Commons file search, e.g. "Bentota beach Sri Lanka" (last-resort fallback). */
async function searchFiles(query: string): Promise<string[]> {
  const j = await getJson("https://commons.wikimedia.org/w/api.php", {
    action: "query",
    list: "search",
    srnamespace: "6",
    srsearch: `${query} filetype:bitmap`,
    srlimit: "15",
  });
  return ((j.query?.search ?? []) as { title: string }[])
    .map((m) => m.title)
    .filter((t) => /\.(jpe?g|png|webp)$/i.test(t));
}

async function commons(fileName: string) {
  const j = await getJson("https://commons.wikimedia.org/w/api.php", {
    action: "query",
    titles: `File:${fileName.replace(/^File:/, "")}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: "1600",
  });
  const page = Object.values(j.query?.pages ?? {})[0] as any;
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const m = info.extmetadata ?? {};
  return {
    title: page.title as string,
    mime: info.mime as string,
    width: info.width as number,
    height: info.height as number,
    sourceUrl: info.descriptionurl as string,
    thumbUrl: (info.thumburl ?? info.url) as string,
    license: stripHtml(m.LicenseShortName?.value ?? ""),
    licenseUrl: m.LicenseUrl?.value ? stripHtml(m.LicenseUrl.value) : null,
    author: stripHtml(m.Artist?.value ?? m.Credit?.value ?? "") || "Unknown author",
  };
}

const result: Record<string, PhotoEntry | null> = existsSync(OUT)
  ? JSON.parse(await readFile(OUT, "utf8"))
  : {};
await mkdir(CACHE, { recursive: true });

for (const place of ALL_SEED_PLACES) {
  if (only.length && !only.includes(place.slug)) continue;
  if (!refresh && !only.length && place.slug in result) continue; // resume

  let chosen: PhotoEntry | null = null;
  /** A usable but small or unattributed curated image, kept only if nothing better turns up. */
  let fallback: PhotoEntry | null = null;
  let qid: string | null = null;
  let coords: { lat: number; lng: number } | null = null;

  for (const title of WIKI_TITLES[place.slug] ?? []) {
    const wp = await wikipedia(title);
    if (!wp) continue;
    const wd = wp.qid ? await wikidata(wp.qid) : { image: undefined, category: undefined, coords: null };
    qid = wp.qid ?? null;
    coords = wd.coords;

    const candidates: [string, PhotoEntry["via"]][] = [];
    if (wd.image) candidates.push([wd.image, "wikidata-p18"]);
    if (wp.lead) candidates.push([wp.lead, "wikipedia-lead"]);
    let triedCategory = false;

    for (let i = 0; i < candidates.length || (!triedCategory && wd.category); i++) {
      if (i >= candidates.length) {
        triedCategory = true;
        for (const f of await categoryFiles(wd.category!)) candidates.push([f, "commons-category"]);
        if (i >= candidates.length) break;
      }
      const [file, via] = candidates[i]!;
      if (rejectedFiles.has(normalise(file))) continue;
      const c = await commons(file);
      if (!c || !/^image\/(jpeg|png|webp)$/.test(c.mime) || !isFreeLicense(c.license)) continue;
      if (rejectedFiles.has(normalise(c.title))) continue;
      // Fallbacks: only large landscape photos (skips maps, plans and scans).
      if (via !== "wikidata-p18" && via !== "wikipedia-lead" && (c.width < 1200 || c.width < c.height * 1.2))
        continue;
      const entry: PhotoEntry = {
        file: c.title,
        sourceUrl: c.sourceUrl,
        thumbUrl: c.thumbUrl,
        author: c.author.slice(0, 200),
        license: c.license,
        licenseUrl: c.licenseUrl,
        wikidata: qid,
        wikidataCoords: coords,
        coordsDeltaM: coords ? Math.round(haversineM({ lat: place.lat, lng: place.lng }, coords)) : null,
        via,
      };
      // Prefer images big enough for a full-width hero, with a named author.
      if (c.width >= 1200 && !/^unknown/i.test(c.author)) {
        chosen = entry;
        break;
      }
      fallback ??= entry;
    }
    if (chosen) break;
  }
  if (!chosen && fallback && !only.length) chosen = fallback;

  // Last resort (no usable curated image, or it was rejected in review): targeted search.
  if (!chosen) {
    if (fallback && only.length)
      console.log(`  · ${place.slug}: curated image is small/unattributed; searching for better`);
    for (const file of await searchFiles(`${place.name} Sri Lanka`)) {
      if (rejectedFiles.has(normalise(file))) continue;
      const c = await commons(file);
      if (!c || !/^image\/(jpeg|png|webp)$/.test(c.mime) || !isFreeLicense(c.license)) continue;
      if (c.width < 1200 || c.width < c.height * 1.2) continue;
      chosen = {
        file: c.title,
        sourceUrl: c.sourceUrl,
        thumbUrl: c.thumbUrl,
        author: c.author.slice(0, 200),
        license: c.license,
        licenseUrl: c.licenseUrl,
        wikidata: qid,
        wikidataCoords: coords,
        coordsDeltaM: coords ? Math.round(haversineM({ lat: place.lat, lng: place.lng }, coords)) : null,
        via: "commons-search",
      };
      break;
    }
  }

  chosen ??= fallback;
  result[place.slug] = chosen;
  if (chosen) {
    const target = `${CACHE}/${place.slug}.img`;
    if (refresh || only.length || !existsSync(target)) {
      const res = await politeFetch(chosen.thumbUrl);
      if (!res.ok) throw new Error(`download ${res.status} ${chosen.thumbUrl}`);
      await writeFile(target, Buffer.from(await res.arrayBuffer()));
    }
  }
  const delta = coords ? Math.round(haversineM({ lat: place.lat, lng: place.lng }, coords)) : null;
  console.log(
    `${chosen ? "✓" : "✗"} ${place.slug.padEnd(34)} ${(chosen ? `${chosen.license} · ${chosen.via}` : "no free photo").padEnd(36)} ${qid ?? "-"} Δ${delta ?? "?"}m`,
  );
  // Save as we go so an interruption doesn't lose progress.
  const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
}

const n = Object.values(result).filter(Boolean).length;
console.log(`\n${n}/${Object.keys(result).length} places have a photo → ${OUT}`);
