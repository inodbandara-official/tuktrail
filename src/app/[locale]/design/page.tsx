import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { CircleAlert, Navigation, Share2 } from "lucide-react";
import { AppHeader } from "@/components/shell/AppHeader";
import { ThemeSegmented } from "@/components/theme/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KmPost } from "@/components/ui/KmPost";
import { PlaceCardSkeleton } from "@/components/ui/Skeleton";
import { StateMessage } from "@/components/ui/StateMessage";
import { PlaceCard } from "@/components/places/PlaceCard";
import { Picture } from "@/components/ui/Picture";
import { COLOR_TOKENS, CONTRAST_PAIRS, contrastRatio, type ColorToken } from "@/shared/design/tokens";
import { createCtx } from "@/server/next/ctx";
import { getOnePlacePerCategory, getPlaceSummariesBySlugs } from "@/server/services/places";
import { ChipDemo, ControlsDemo } from "./demos";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("design");
  return { title: t("title"), robots: { index: false } };
}

function designPageEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_DESIGN_PAGE === "true";
}

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t-2 border-line py-10">
      <h2 id={id} className="text-2xl">
        {title}
      </h2>
      {hint && <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

const SWATCHES: ColorToken[] = [
  "bg",
  "surface",
  "surface-sunk",
  "ink",
  "ink-muted",
  "line",
  "line-strong",
  "laterite",
  "laterite-soft",
  "tea",
  "tea-soft",
  "ocean",
  "ocean-soft",
  "monsoon",
  "warn",
  "warn-soft",
  "danger",
];

const TYPE_SCALE = [
  { cls: "text-4xl font-display", label: "4xl · 44" },
  { cls: "text-3xl font-display", label: "3xl · 36" },
  { cls: "text-2xl font-display", label: "2xl · 30" },
  { cls: "text-xl font-display", label: "xl · 24" },
  { cls: "text-lg font-semibold", label: "lg · 20" },
  { cls: "text-base", label: "base · 17" },
  { cls: "text-sm", label: "sm · 15" },
  { cls: "text-xs font-semibold", label: "xs · 13" },
];

async function SampleCards() {
  await connection();
  const ctx = createCtx();
  const places = await getPlaceSummariesBySlugs(ctx, ["ravana-falls", "sigiriya", "mirissa-beach"]);
  const distances = [850, 2400, 18300];
  return (
    <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {places.map((p, i) => (
        <li key={p.id}>
          <PlaceCard
            place={{ ...p, distanceM: distances[i] }}
            href={`/places/${p.slug}`}
            selected={i === 1}
          />
        </li>
      ))}
    </ul>
  );
}

async function PlaceholderGrid() {
  await connection();
  const t = await getTranslations("categories");
  const places = await getOnePlacePerCategory(createCtx());
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {places.map((p) =>
        p.heroImage ? (
          <li key={p.id} className="overflow-hidden rounded-md border-2 border-line bg-surface">
            <Picture image={p.heroImage} sizes="(min-width: 1024px) 180px, 45vw" className="aspect-[8/5]" />
            <p className="px-2 py-1.5 text-xs font-semibold">{t(p.category)}</p>
          </li>
        ) : null,
      )}
    </ul>
  );
}

function CardsFallback() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <PlaceCardSkeleton />
      <PlaceCardSkeleton />
      <PlaceCardSkeleton />
    </div>
  );
}

export default async function DesignPage() {
  if (!designPageEnabled()) notFound();
  const t = await getTranslations("design");
  const ts = await getTranslations("states");
  const tc = await getTranslations("common");
  const td = await getTranslations();

  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="flex flex-col items-start gap-4 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl">{t("title")}</h1>
            <p className="mt-3 max-w-[56ch] text-ink-muted">{t("intro")}</p>
          </div>
          <ThemeSegmented />
        </div>

        <Section id="colours" title={t("colours")} hint={t("coloursHint")}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SWATCHES.map((tok) => (
              <li key={tok} className="overflow-hidden rounded-md border-2 border-line bg-surface">
                <div className="h-16" style={{ background: `var(--${tok})` }} />
                <div className="px-2.5 py-2">
                  <p className="text-sm font-semibold">{tok}</p>
                  <p className="tabular text-xs text-ink-muted">
                    {COLOR_TOKENS.light[tok]} / {COLOR_TOKENS.dark[tok]}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div
            className="mt-8 overflow-x-auto rounded-md border-2 border-line"
            role="region"
            aria-label={t("contrastTable")}
            tabIndex={0}
          >
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-surface-sunk">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {t("pair")}
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {t("themeLight")}
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {t("themeDark")}
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {t("minimum")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface">
                {CONTRAST_PAIRS.map((p) => {
                  const l = contrastRatio(COLOR_TOKENS.light[p.fg], COLOR_TOKENS.light[p.bg]);
                  const d = contrastRatio(COLOR_TOKENS.dark[p.fg], COLOR_TOKENS.dark[p.bg]);
                  return (
                    <tr key={`${p.fg}-${p.bg}`} className="border-t border-line">
                      <td className="px-3 py-2">
                        <span className="font-semibold">{t("pairOn", { fg: p.fg, bg: p.bg })}</span>
                        <span className="block text-xs text-ink-muted">{p.use}</span>
                      </td>
                      {[l, d].map((r, i) => (
                        <td key={i} className="tabular px-3 py-2">
                          {t("contrast", { ratio: r.toFixed(2) })}{" "}
                          <Badge tone={r >= p.min ? "tea" : "warn"}>
                            {r >= p.min ? t("pass") : t("fail")}
                          </Badge>
                        </td>
                      ))}
                      <td className="tabular px-3 py-2">{t("contrast", { ratio: p.min })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="type" title={t("typography")} hint={t("typographyHint")}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <ul className="flex min-w-0 flex-col gap-3">
              {TYPE_SCALE.map((s) => (
                <li key={s.label} className="flex min-w-0 items-baseline gap-4">
                  <span className="tabular w-20 shrink-0 text-xs text-ink-muted">{s.label}</span>
                  <span className={`${s.cls} min-w-0 truncate`}>{t("displaySample")}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-lg border-2 border-line bg-surface p-5">
              <h3 className="text-xl">{t("displaySample")}</h3>
              <p className="mt-2 text-base">{t("bodySample")}</p>
              <p className="tabular mt-3 text-lg font-semibold">{t("numeralsSample")}</p>
            </div>
          </div>
        </Section>

        <Section id="components" title={t("components")}>
          <div className="flex flex-col gap-10">
            <div>
              <h3 className="mb-3 text-lg">{t("buttons")}</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button icon={<Navigation aria-hidden className="size-5" />}>{t("primary")}</Button>
                <Button variant="secondary" icon={<Share2 aria-hidden className="size-5" />}>
                  {t("secondary")}
                </Button>
                <Button variant="quiet">{t("quiet")}</Button>
                <Button disabled>{t("disabled")}</Button>
                <Button size="lg" icon={<Navigation aria-hidden className="size-5" />}>
                  {t("primary")}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg">{t("chips")}</h3>
              <ChipDemo />
            </div>

            <div>
              <ControlsDemo />
            </div>

            <div>
              <h3 className="mb-3 text-lg">{t("badges")}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge tone="warn" icon={<CircleAlert aria-hidden className="size-3.5" />}>
                  {tc("unverified")}
                </Badge>
                <Badge tone="tea">{t("goodThisMonth")}</Badge>
                <Badge tone="ocean">{td("districts.galle")}</Badge>
                <Badge tone="laterite">{td("categories.temple")}</Badge>
                <Badge>{td("provinces.uva")}</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-lg">{t("kmPost")}</h3>
              <p className="mt-1 mb-4 text-sm text-ink-muted">{t("kmPostHint")}</p>
              <div className="flex flex-wrap items-end gap-4">
                <KmPost distanceM={350} label={tc("mAway", { distance: 350 })} />
                <KmPost distanceM={2400} label={tc("kmAway", { distance: "2.4" })} />
                <KmPost distanceM={48000} label={tc("kmAway", { distance: "48" })} />
                <KmPost distanceM={2400} size="sm" label={tc("kmAway", { distance: "2.4" })} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg">{t("card")}</h3>
              <Suspense fallback={<CardsFallback />}>
                <SampleCards />
              </Suspense>
            </div>
          </div>
        </Section>

        <Section id="placeholders" title={t("placeholders")} hint={t("placeholdersHint")}>
          <Suspense fallback={<CardsFallback />}>
            <PlaceholderGrid />
          </Suspense>
        </Section>

        <Section id="states" title={t("states")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border-2 border-line bg-surface p-4">
              <p className="mb-3 text-xs font-bold tracking-wider text-ink-muted uppercase">{t("loading")}</p>
              <div className="flex flex-col gap-3">
                <PlaceCardSkeleton />
                <PlaceCardSkeleton />
              </div>
            </div>
            <div className="rounded-lg border-2 border-line bg-surface">
              <p className="px-4 pt-4 text-xs font-bold tracking-wider text-ink-muted uppercase">
                {t("empty")}
              </p>
              <StateMessage kind="empty" title={ts("emptyTitle")} body={ts("emptyBody")} />
            </div>
            <div className="rounded-lg border-2 border-line bg-surface">
              <p className="px-4 pt-4 text-xs font-bold tracking-wider text-ink-muted uppercase">
                {t("error")}
              </p>
              <StateMessage
                kind="error"
                title={ts("errorTitle")}
                body={ts("errorBody")}
                action={<Button variant="secondary">{tc("retry")}</Button>}
              />
            </div>
            <div className="rounded-lg border-2 border-line bg-surface">
              <p className="px-4 pt-4 text-xs font-bold tracking-wider text-ink-muted uppercase">
                {t("offline")}
              </p>
              <StateMessage kind="offline" title={tc("offline")} body={tc("offlineHint")} />
            </div>
          </div>
        </Section>

        <Section id="spacing" title={t("spacing")}>
          <div className="flex flex-wrap items-end gap-6">
            {[4, 8, 12, 16, 24, 32, 48].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <span className="block bg-ocean" style={{ width: s, height: s }} />
                <span className="tabular text-xs text-ink-muted">{s}</span>
              </div>
            ))}
            {[
              ["sm", "rounded-sm"],
              ["md", "rounded-md"],
              ["lg", "rounded-lg"],
              ["xl", "rounded-xl"],
            ].map(([n, c]) => (
              <div key={n} className="flex flex-col items-center gap-2">
                <span className={`block size-14 border-2 border-line-strong bg-surface ${c}`} />
                <span className="text-xs text-ink-muted">{n}</span>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </>
  );
}
