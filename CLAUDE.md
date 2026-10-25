# TukTrail — project guide

Location-based tourist guide for Sri Lanka. Next.js web app now; a React Native app will later consume the same `/api/v1` REST API. Mobile-first, outdoor legibility, slow connections.

@AGENTS.md

## Working rules (from the product owner)

- Build **phase by phase**. End of every phase: run app → `pnpm screenshots` (390×844 + 1440×900, light + dark, every touched screen) → review PNGs, fix, re-shoot → `pnpm a11y` + polish pass → `pnpm typecheck && pnpm lint && pnpm test` → git commit → summary + screenshots → **stop and wait for go-ahead**.
- **Never invent factual place data** (fees, opening hours, phone numbers). Leave null, `is_verified = false`. General route notes ("how to get there") and descriptions were added at the owner's request (Phase 3) as unverified guidance — never fares, timetables or contacts.
- **Images**: real photos only from Wikimedia Commons under free licences (CC0/BY/BY-SA/FAL/PD), reviewed by eye, self-hosted, credited with author + licence + source link. Never hotlink; never NC/ND. (Owner request before Phase 4; replaces the original placeholder-only rule.)
- All UI strings in `messages/*.json` (lint-enforced via `react/jsx-no-literals`).
- Secrets only in `.env`; keep `.env.example` complete.
- Use current stable library versions; check official docs (Next ships its docs in `node_modules/next/dist/docs/`).

## Stack (versions pinned Oct 2026)

| Area       | Choice                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Framework  | Next.js 16.4 App Router, React 19.3, Turbopack, `cacheComponents` + `partialPrefetching` on    |
| Language   | TypeScript 6.0 strict (`noUncheckedIndexedAccess`). Not 7.x: typescript-eslint requires `<6.1` |
| Styling    | Tailwind CSS 4.3 (CSS-first `@theme`), lucide-react icons                                      |
| DB         | PostgreSQL 18 + PostGIS 3.6 (Docker), Drizzle ORM 0.45 / drizzle-kit 0.31, `pg` driver         |
| Validation | Zod 4                                                                                          |
| Auth       | Better Auth 1.7 (Google + magic link; `bearer` plugin for mobile) — Phase 4                    |
| Storage    | S3 API via AWS SDK v3. Local: RustFS. Prod: Cloudflare R2 or AWS S3                            |
| Email      | Nodemailer + SMTP. Local: Mailpit (UI :8025)                                                   |
| Images     | `sharp` (EXIF strip, AVIF/WebP 400/800/1600 + LQIP), `exifr` (GPS read)                        |
| i18n       | next-intl 4.14, `localePrefix: "as-needed"`, English only (si/ta later)                        |
| Maps       | MapLibre GL JS 6.15 + OpenFreeMap vector tiles (no key) via `@vis.gl/react-maplibre` 8.1       |
| Client     | TanStack Query 5 (API data), nuqs 2 (URL state), Zustand 5 (location + map/list selection)     |
| PWA        | Serwist (Turbopack integration) — Phase 6                                                      |
| Tests      | Vitest 5 (unit + integration), Playwright 1.64 (e2e, screenshots, a11y audit with axe-core)    |

## Commands

```bash
pnpm bootstrap        # services up + buckets + migrate + seed (first run)
pnpm dev              # http://localhost:3000   (design system: /design)
pnpm services:up      # docker compose: db :5544, storage :9000 (console :9001), mail :1025/:8025
pnpm db:generate      # drizzle-kit generate (then fix geography quoting, see Gotchas)
pnpm db:migrate       # apply ./drizzle to DATABASE_URL (`pnpm db:migrate --test` for TEST_DATABASE_URL)
pnpm db:seed          # idempotent; `pnpm db:seed --force` overwrites seeded places
pnpm db:reset         # local only: drop schema, migrate, seed
pnpm storage:init     # create buckets, public-read policy, CORS (local dev)
pnpm typecheck        # next typegen && tsc --noEmit
pnpm lint | format    # ESLint flat config + Prettier (tailwind plugin)
pnpm test             # Vitest unit + integration (integration needs compose db)
pnpm e2e              # Playwright end-to-end
pnpm screenshots --phase N [--click "Name"]… [--geo lat,lng|denied] [--choice gps|manual] [--wait ms] [--name x] [--viewport-only] / "/?town=ella"
pnpm a11y [--choice manual] / /design   # axe + 44px tap targets + keyboard focus visibility
pnpm map:styles       # rebuild public/map/tuktrail-{light,dark}.json from OpenFreeMap positron + our palette
pnpm contrast         # print WCAG ratios for all token pairs
```

Never name a script `audit` or `setup` — both are pnpm built-ins.

## Folder conventions

```
src/app/[locale]/…        pages (root layout is [locale]/layout.tsx)
src/app/api/v1/…          versioned REST route handlers — thin: parse → service → JSON
src/app/api/auth/…        Better Auth handler (library-owned, unversioned)
src/components/ui         primitives (Button, Chip, Badge, KmPost, Switch, Picture, StateMessage…)
src/components/<domain>   places/, emergency/, theme/, shell/, providers/
src/components/map        provider-agnostic map: PlacesMap (entry), types.ts (contract), MapPin, geo; maplibre/ = implementation
src/features/<feature>    client hooks + composition: nearby/ (screen, list, filters, URL params, queries, selection), location/ (store, explainer, picker), api/ (fetch client)
src/server/services       business logic. Framework-agnostic: no next/*, react, cookies, Request (lint-enforced)
src/server/db             Drizzle client, schema/, geography custom type, migrate/reset scripts
src/server/next           Next-only glue: createCtx(), apiHandler()
src/server/storage|lib    S3 wrapper, image pipeline
src/server/seed           seed data + runner
src/shared                Zod schemas, DTO types, constants, design tokens. No server/React imports (future shared package)
src/i18n                  routing, request config, navigation
messages/en.json          all UI strings
tests/unit|integration|e2e
scripts/                  screenshots, a11y audit, contrast
```

- Server components may call services directly via `createCtx()`; client components call `/api/v1`.
- Services take `Ctx { db, storage, now, actor }` and return DTOs from `src/shared/schemas`. Throw `AppError(code, msg)`.
- Route handlers: wrap with `apiHandler()` → uniform `{ error: { code, message, details? } }`, `connection()` for request-time rendering, never log query strings.
- Public DTOs never include `capture_lat/lng`, uploader or moderation fields (`toImageDto`, unit-tested).

### API (implemented so far)

| Endpoint                                                                    | Notes                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/v1/health`                                                        | DB + PostGIS check                                                                                                       |
| `GET /api/v1/places/nearby?lat&lng&radius_km&category&month&q&cursor&limit` | `ST_DWithin` + `ST_Distance`, keyset cursor `(distance,id)` bound to a query fingerprint; `total` on page 1; `no-store`  |
| `GET /api/v1/places/points?…same filters`                                   | lightweight markers (≤500) for map clustering; `no-store`                                                                |
| `GET /api/v1/towns?q` / `GET /api/v1/towns/:slug`                           | manual location fallback (trigram search, hubs when empty)                                                               |
| `GET /api/v1/places/:slug`                                                  | full detail DTO: approved images (hero first), practical fields, derived `nearestTown`                                   |
| `POST /api/v1/uploads/presign` (user)                                       | `{placeId, files[{contentType,size}]}` → presigned PUT URLs into the **private** bucket (10 min); ≤20 open intents/user  |
| `POST /api/v1/submissions` (user)                                           | `{placeId, intentIds, device?, caption?}` → verify visit → strip EXIF → pending; 422 `OUTSIDE_VISIT_RADIUS` with details |
| `GET /api/v1/me/uploads` · `DELETE /api/v1/me/uploads/:id` (user)           | own photos (any status; pending/rejected via short-lived signed URLs) · withdraw a pending photo                         |
| `/api/auth/*`                                                               | Better Auth: magic link, Google (when configured), session; cookie or `Authorization: Bearer`                            |

`category` accepts CSV or repeated params. Coordinates are rounded to 3 dp in the schema itself.

### Nearby screen

- Origin priority: `?at=lat,lng` (map pick) > `?town=slug` > GPS (if user chose it) > Colombo. GPS never enters the URL; rounded fix is kept in `sessionStorage` only (for the detail page). The explainer choice is remembered in `localStorage` (`tuktrail.locationChoice`).
- URL state (nuqs): `cat`, `month` (bool → current Colombo month), `q` (debounced 300 ms), `r`, `town`, `at`.
- Mobile: full-screen map + non-modal `BottomSheet` (peek/half/full) holding search, chips and list — all controls in the thumb zone. Desktop ≥64rem: same DOM becomes a 26rem side panel.
- Sync: `useSelection` store. Card tap = select + map `flyTo` (+ Directions / View details actions). Marker tap = select + scroll card into view (pages in more results if needed).

## Design tokens — "Roadside Ceylon"

Source of truth: `src/shared/design/tokens.ts`, mirrored in `src/app/globals.css` (unit test keeps them in sync and asserts WCAG AA for every pair in `CONTRAST_PAIRS`). Theme: `<html data-theme="light|dark">` forces; no attribute follows the device. Tailwind `dark:` variant follows the same rule.

| Token                  | Light             | Dark              | Use                                           |
| ---------------------- | ----------------- | ----------------- | --------------------------------------------- |
| bg                     | #F4ECDD           | #16120E           | page (sand / wet earth)                       |
| surface                | #FFFBF4           | #211B16           | cards, sheets                                 |
| surface-sunk           | #EBE0CC           | #0F0C09           | wells, skeletons                              |
| ink                    | #1F1A15           | #F4ECDD           | text                                          |
| ink-muted              | #5A4F44           | #C2B5A4           | secondary text                                |
| line / line-strong     | #D8CAB3 / #8C7C69 | #3A3029 / #7D6E5E | borders / input borders                       |
| laterite (+ink, +soft) | #9A3B1F           | #E8875F           | primary action, active chip, temples/heritage |
| tea (+soft)            | #2E5A36           | #8CC79A           | nature categories, success, switch on         |
| ocean (+soft)          | #0B6670           | #5CC4CC           | links, water categories, focus ring           |
| monsoon                | #3B4A5A           | #A9B9CA           | info, viewpoint/museum/other                  |
| warn (+soft)           | #7A4F00           | #F0B84A           | "not yet verified"                            |
| danger                 | #A3221B           | #FF8A7A           | errors, emergency                             |

- **Type**: Young Serif (display, headings only, weight 400) + Atkinson Hyperlegible Next (body/UI). Tabular numerals via `.tabular`.
- **Scale** (rem → px): xs .8125/13 · sm .9375/15 · base 1.0625/17 · lg 1.25/20 · xl 1.5/24 · 2xl 1.875/30 · 3xl 2.25/36 · 4xl 2.75/44.
- **Radius**: sm 6 · md 10 · lg 16 · xl 24. **Tap targets** ≥ 44px (`.tap`, `min-h-11`). **Focus**: 3px `--focus` outline, 2px offset.
- **Borders over shadows** (glare kills subtle elevation). Category = colour tone **+ unique icon** (never colour alone); temple and waterfall icons are custom SVG.
- **Signature**: `KmPost` distance marker, styled after roadside kilometre posts. Placeholder art generated per category (`src/server/seed/placeholders.ts`). Images dim slightly in dark mode.

### Place detail page (`/places/[slug]`)

- Static shell (header + back link) + `<Suspense>` content, so list → detail navigations are instant. Data via `getCachedPlace()` (`'use cache'`, `cacheLife("hours")`, tags `places` / `place:<slug>` for admin revalidation). `generateStaticParams` prerenders all published slugs (falls back to a 404 sentinel if the DB is unreachable at build).
- Unknown slugs: `notFound()` inside the stream → 200 + designed not-found + `noindex` (Next's documented behaviour for streamed 404s).
- Practical info shows only filled fields. Fees/hours are never seeded; an explicit "only listed once confirmed" row explains the gap. Nearest town + distance is computed from the towns table (KNN `<->`).
- Distance from the user is computed in the browser from the session's rounded GPS fix — the detail page never sends location anywhere.
- Gallery: native `<dialog>` lightbox (Esc, arrows, swipe). Read more toggles server-rendered markdown (SEO-visible). Share: Web Share API → copy-link fallback.
- SEO: metadata + canonical, `opengraph-image.tsx` (typographic brand card; passes `locale` explicitly because root params aren't available in route handlers), `TouristAttraction` JSON-LD with only facts we hold.

### Auth & uploads (Phase 4)

- Better Auth (`src/server/auth/auth.ts`): magic link via SMTP (Mailpit locally), Google only when `GOOGLE_CLIENT_ID/SECRET` are set, `bearer` plugin for the mobile app, `role` additional field (`input: false`). Rate limiting on in production only (Better Auth's default) so e2e can sign in repeatedly.
- `apiHandler(fn, { auth: "user" | "admin" })` resolves the session (cookie or bearer) into `ctx.actor`; 401/403 otherwise; responses become `no-store, private`.
- Visit verification (`services/verification.ts`): accept if the **device** location is within `visit_radius_m` (+ up to 150 m GPS-accuracy allowance) OR **every** photo's EXIF GPS is within it. Otherwise 422 with the closest distance and which files failed.
- Pipeline: presigned PUT → server re-checks real size + real format (sharp, not the claimed type) → EXIF read → sharp strips metadata and renders sizes into the **private** bucket (`pending/…`) → `place_images` pending + `upload_submissions` row → raw upload deleted, intents consumed. Approved photos are copied to the public bucket in Phase 5. Capture point stored rounded to 4 dp, cleared on moderation.
- Daily submission limit from `UPLOAD_SUBMISSIONS_PER_DAY` (rolling 24 h, counted in Postgres).
- UI: `/sign-in` (uncontrolled email field so pre-hydration typing isn't lost), header `AccountButton` (Suspense-wrapped; header is `z-40` so its menu sits above page overlays), `/places/[slug]/photos/new` (`SignInGate` + `UploadForm`: previews, XHR progress, device-location switch, friendly radius errors scrolled into view), `/me/uploads`.

### Place photos (Wikimedia Commons)

- `pnpm photos:fetch [slug…]` → `src/server/seed/photos.json` (committed metadata) + `.cache/place-photos/` (gitignored). Preference: Wikidata P18 → Wikipedia lead → Commons category → Commons search; free licences only; prefers ≥1200 px with a named author.
- **Every chosen photo is reviewed by eye** (contact sheets). Wrong/unrepresentative files go into `photo-rejections.ts` and are never picked again; `photos.json` is the reviewed source of truth — re-fetching requires another review.
- The seed processes them like uploads (EXIF stripped, AVIF/WebP sizes, LQIP), stores credit (`attribution`, `license`, `license_url`, `source_url`), makes them the hero, retires placeholders and removes previously seeded photos that are no longer chosen. Credits show under the hero and in the lightbox (`PhotoCredit`).
- `coord-overrides.ts`: 22 point-like places moved to Wikidata coordinates (only when Wikidata is more precise than an arc-minute and 300 m–3 km from ours; wrong-item matches excluded).

## Key decisions (and why)

- **Better Auth instead of Auth.js** — Auth.js v5 never went stable and is maintenance-only; Better Auth has a Drizzle adapter, magic link, and bearer/Expo support for the mobile app. (Approved by owner, Phase 0.)
- **RustFS instead of MinIO locally** — MinIO stopped publishing community Docker images. App only speaks S3, so R2/S3/MinIO-from-source swap by env.
- **Two buckets** (private incoming, public processed) — R2 has no per-prefix public access.
- **Presigned PUT with signed Content-Type/Length** — R2 doesn't support presigned POST policies.
- **Pre-generated image variants + `<picture>`**, not `next/image` — no runtime optimiser cost, works for the mobile app, avoids Next 16's local-IP block in dev.
- **Theme via inline head script + cookie read client-side** — calling `cookies()` in the root layout would make every route dynamic under Cache Components.
- **next-intl with `next/root-params`** (not `setRequestLocale`) — recommended for Next 16.3+; Route Handlers pass `locale` explicitly.
- **Rate limits in Postgres** (Better Auth `rate_limit` table, `upload_submissions` counts) — no Redis needed in v1.
- **User GPS never stored or logged**: rounded to 3 dp client-side, per request only, never in URLs. `capture_lat/lng` on images are cleared after moderation.
- **Text search (`q`) is island-wide, distance-sorted** (radius ignored) — refinement from Phase 0; owner may veto.
- **`upload_intents` + `upload_submissions` tables** — submissions may only reference keys issued to that user; submissions drive rate limiting.
- **Design page** `/design` is on in dev, off in production unless `ENABLE_DESIGN_PAGE=true` (evaluated at build).
- **MapLibre + OpenFreeMap instead of Google Maps** (owner decision, Phase 2) — no API key, no billing, open data. Directions stay a plain Google Maps URL deep link (`src/shared/lib/directions.ts`).
- **`@vis.gl/react-maplibre` over a hand-rolled wrapper** — it's react-map-gl v8's MapLibre-only package: declarative `<Source>/<Layer>/<Marker>`, maintained, small. Hidden behind our own `PlacesMapProps` contract (`src/components/map/types.ts`) so the provider can be swapped by writing one component.
- **Clustering = MapLibre GeoJSON clustering; markers = HTML `<button>`s** rendered from `querySourceFeatures` — keyboard/screen-reader reachable, styled with tokens. The selected place is always drawn, even if its neighbours are clustered.
- **Themed styles are generated, self-hosted JSON** (`public/map/tuktrail-{light,dark}.json`) derived from OpenFreeMap's _positron_ (one layer-id table for both themes). OpenFreeMap requires custom styles to be self-hosted; tiles/glyphs/sprites still come from OpenFreeMap. Style switches with the app's resolved colour scheme.
- **Attribution**: MapLibre `AttributionControl` in compact mode — visible on load, collapses to an (i) after the first pan, which the OSM attribution guidelines allow. Restyled for legibility in both themes and lifted above the bottom sheet.
- **Camera padding = overlay insets** (`map.setPadding`), so `fitBounds`/`flyTo` centre on the _visible_ map above the sheet. Padding is only re-animated when it actually changes — an unconditional `easeTo` cancels in-flight framing. Single points are framed with `easeTo` (zero-area bounds can\'t be fitted); `frameMaxZoom` controls how close.
- **Fuzzy search threshold 0.62** (`word_similarity`) — keeps typos ("sigirya", "mirisa"), drops noise ("fort" ≠ "Forest").

## Gotchas

- **drizzle-kit quotes custom types**: after `pnpm db:generate`, replace `"geography(Point, 4326)"` with `geography(Point, 4326)` in the new SQL file.
- **Backslashes in files**: write regex-bearing files (e.g. `src/proxy.ts` matcher `.*\\..*`) with an editor, not shell heredocs — a lost backslash broke all non-root routing once.
- **Cache Components**: read `cookies()/headers()/searchParams` or uncached DB data only inside `<Suspense>` (or `'use cache'` helpers). No `export const runtime/dynamic/revalidate`. `generateStaticParams` must return ≥1 entry. Route handlers call `connection()` (done in `apiHandler`).
- Inline `<script>`s (theme init) go through the client `InlineScript` helper, else React warns on client renders.
- `[locale]/[...rest]` catch-all (with `instant = false`) routes unknown URLs to the designed `[locale]/not-found`.
- **MapLibre worker**: MapLibre 6 loads its worker via `new URL(<variable>, import.meta.url)`, which bundlers can't follow. `scripts/sync-map-worker.mjs` copies it to `public/map/` (gitignored) before `dev`/`build`; the map calls `setWorkerUrl`. If the map is blank with "Worker failed to load", run `node scripts/sync-map-worker.mjs`.
- `maplibre-gl` CSS overrides live in `globals.css` under `.tt-map` (attribution, 44px zoom buttons, dark icon inversion).
- In dev the map instance is exposed as `window.__ttMap` (e2e tests and debugging only).
- **E2E**: each test renders WebGL in software; keep `workers: 2`, 60 s timeouts, and the warm-up `globalSetup` (cold `next dev` route compiles exceed expect timeouts).
- `pnpm` 10 blocks build scripts; `esbuild` is allowed in `pnpm-workspace.yaml`.
- **Windows dev**: if Turbopack panics with `0xc0000142`, stale dev processes are holding resources — kill node processes for this project and delete `.next/dev`.
- Postgres from compose is on host port **5544** (5432 is taken by a local install).
- `pnpm db:seed` placeholder images go through the real image pipeline into the public bucket; run `pnpm storage:init` first.
- `next dev` re-adds the block in `AGENTS.md` — commit it.

## Seed data notes

116 places across all 9 provinces (23 more in `places-extra.ts`, added before Phase 4); 111 have a reviewed Commons photo, 5 keep a placeholder. Earlier text: 93 places across all 9 provinces: `src/server/seed/places.ts` (original 36) + `places-more.ts` (57 added in Phase 3 around Anuradhapura, Colombo, Jaffna, Galle, Matara, Ella/Badulla, Kandy, Nuwara Eliya, Hambantota, Polonnaruwa, Dambulla, Trincomalee), combined in `all-places.ts`. "How to get there" notes for the original 36 live in `access.ts`. Original descriptions; fees/hours/phone numbers never seeded; all unverified. Entries flagged `checkCoords: true` have approximate coordinates — spot-check before launch (the detail-page mini map makes errors easy to see). `pnpm db:seed --force` re-applies seed text to existing places. 60 towns (25 district capitals + traveller hubs). Admin user from `SEED_ADMIN_EMAIL`.
