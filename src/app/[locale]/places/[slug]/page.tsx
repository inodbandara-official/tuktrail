import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import Markdown from "react-markdown";
import { ArrowLeft, Camera, CircleAlert, ExternalLink, Navigation } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCachedPlace, getCachedSlugs } from "@/server/next/places";
import { googleMapsDirectionsUrl } from "@/shared/lib/directions";
import { CATEGORY_TONE } from "@/shared/design/tokens";
import { AppHeader } from "@/components/shell/AppHeader";
import { CategoryIcon } from "@/components/places/CategoryIcon";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { DistanceFromYou } from "@/features/place/DistanceFromYou";
import { Gallery } from "@/features/place/Gallery";
import { jsonLdString, touristAttractionJsonLd } from "@/features/place/jsonld";
import { PlaceMiniMap } from "@/features/place/PlaceMiniMap";
import { PracticalInfo } from "@/features/place/PracticalInfo";
import { ReadMore } from "@/features/place/ReadMore";
import { ShareButton } from "@/features/place/ShareButton";

const toneText = {
  laterite: "text-laterite",
  tea: "text-tea",
  ocean: "text-ocean",
  monsoon: "text-monsoon",
} as const;
const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateStaticParams() {
  try {
    const slugs = await getCachedSlugs();
    if (slugs.length) return slugs.map((slug) => ({ slug }));
  } catch (err) {
    console.warn("[places] DB unavailable at build; place pages will render on first request.", err);
  }
  // Cache Components needs ≥1 entry; this one simply 404s.
  return [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/places/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const place = await getCachedPlace(slug);
  if (!place) return {};
  const t = await getTranslations();
  const url = `${appUrl()}/places/${place.slug}`;
  return {
    title: place.name,
    description: place.shortDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: place.name,
      description: place.shortDescription,
      siteName: t("meta.appName"),
    },
    twitter: { card: "summary_large_image", title: place.name, description: place.shortDescription },
  };
}

/** Static shell (header, back link) renders instantly; place content streams in. */
export default async function PlacePage({ params }: PageProps<"/[locale]/places/[slug]">) {
  const t = await getTranslations("place");
  return (
    <>
      <AppHeader />
      <main id="main" className="pb-16">
        <nav className="mx-auto max-w-6xl px-4 py-2">
          <Link
            href="/"
            className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 font-semibold text-ocean"
          >
            <ArrowLeft aria-hidden className="size-5" />
            {t("backToNearby")}
          </Link>
        </nav>
        <Suspense fallback={<PlaceSkeleton />}>
          <PlaceContent params={params} />
        </Suspense>
      </main>
    </>
  );
}

function PlaceSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-6xl lg:px-4">
      <Skeleton className="aspect-[4/3] w-full rounded-none sm:aspect-[16/9] lg:aspect-[21/9] lg:rounded-xl" />
      <div className="flex flex-col gap-3 px-4 pt-6 lg:px-0">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-4 h-12 w-64" />
      </div>
    </div>
  );
}

async function PlaceContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getCachedPlace(slug);
  if (!place) notFound();

  const t = await getTranslations();
  const format = await getFormatter();
  const tone = CATEGORY_TONE[place.category];
  const region = t("place.region", {
    district: t(`districts.${place.district}`),
    province: t(`provinces.${place.province}`),
  });
  const url = `${appUrl()}/places/${place.slug}`;
  const directions = googleMapsDirectionsUrl(place.location);
  const coords = [place.location.lat.toFixed(4), place.location.lng.toFixed(4)].join(", ");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(touristAttractionJsonLd(place, url, t(`provinces.${place.province}`))),
        }}
      />
      <div className="mx-auto max-w-6xl lg:px-4">
        <Gallery images={place.images} />
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <article className="min-w-0 lg:col-start-1 lg:row-start-1">
          <p
            className={cx(
              "flex items-center gap-1.5 text-sm font-bold tracking-wider uppercase",
              toneText[tone],
            )}
          >
            <CategoryIcon category={place.category} className="size-4.5" strokeWidth={2.25} />
            {t(`categories.${place.category}`)}
          </p>
          <h1 className="mt-2 text-4xl sm:text-[3.25rem] sm:leading-[1.02]">{place.name}</h1>
          <p className="mt-2 font-semibold text-ink-muted">{region}</p>
          {!place.isVerified && (
            <Badge tone="warn" className="mt-3" icon={<CircleAlert aria-hidden className="size-3.5" />}>
              {t("common.unverified")}
            </Badge>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              icon={<Navigation aria-hidden className="size-5" />}
              aria-label={t("common.directionsExternal")}
            >
              {t("common.directions")}
              <ExternalLink aria-hidden className="size-4 opacity-80" />
            </ButtonLink>
            <ShareButton title={place.name} text={t("place.shareText", { name: place.name })} />
          </div>
          <div className="mt-4">
            <DistanceFromYou place={place.location} />
          </div>

          <section aria-labelledby="about-title" className="mt-10">
            <h2 id="about-title" className="text-2xl">
              {t("place.about")}
            </h2>
            <p className="mt-3 text-lg leading-relaxed">{place.shortDescription}</p>
            {place.fullDescription && (
              <ReadMore>
                <div className="prose-tt flex max-w-[65ch] flex-col gap-4 leading-relaxed">
                  <Markdown
                    components={{
                      // Content headings sit below the page's h2s.
                      h1: "h3",
                      h2: "h3",
                      a: ({ href, children }) => (
                        <a href={href} className="text-ocean underline" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {place.fullDescription}
                  </Markdown>
                </div>
              </ReadMore>
            )}
          </section>

          <section
            aria-labelledby="share-title"
            className="mt-10 flex flex-col items-start gap-3 rounded-xl border-2 border-line bg-surface p-5"
          >
            <h2 id="share-title" className="flex items-center gap-2 text-xl">
              <Camera aria-hidden className="size-6 text-laterite" />
              {t("upload.cta")}
            </h2>
            <p className="text-ink-muted">{t("upload.ctaBody")}</p>
            <Link href={`/places/${place.slug}/photos/new`} className={buttonClasses("secondary")}>
              {t("upload.ctaButton")}
            </Link>
          </section>

          {!place.isVerified && (
            <p className="mt-8 flex gap-2.5 rounded-md bg-warn-soft p-4 text-sm text-warn">
              <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
              <span>{t("place.unverifiedBody")}</span>
            </p>
          )}
        </article>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <PracticalInfo place={place} />
        </aside>

        <section aria-labelledby="location-title" className="lg:col-start-1 lg:row-start-2">
          <h2 id="location-title" className="mb-3 text-2xl">
            {t("place.location")}
          </h2>
          <PlaceMiniMap
            point={{
              id: place.id,
              slug: place.slug,
              name: place.name,
              category: place.category,
              lat: place.location.lat,
              lng: place.location.lng,
            }}
          />
          <p className="tabular mt-2 text-sm text-ink-muted">{coords}</p>
          <p className="mt-6 text-xs text-ink-muted">
            {t("place.lastUpdated", {
              date: format.dateTime(new Date(place.updatedAt), { dateStyle: "medium" }),
            })}
          </p>
        </section>
      </div>
    </>
  );
}
