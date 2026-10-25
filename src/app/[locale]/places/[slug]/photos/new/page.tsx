import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getCachedPlace } from "@/server/next/places";
import { SignInGate } from "@/features/uploads/SignInGate";
import { UploadForm } from "@/features/uploads/UploadForm";
import { UPLOAD_MAX_FILES } from "@/shared/schemas/uploads";

export const metadata: Metadata = { robots: { index: false } };

export default function NewPhotosPage({ params }: PageProps<"/[locale]/places/[slug]/photos/new">) {
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto max-w-2xl px-4 pt-2 pb-16">
        <Suspense
          fallback={
            <div aria-hidden className="flex flex-col gap-4 pt-12">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          }
        >
          <Content params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getCachedPlace(slug);
  if (!place) notFound();
  const t = await getTranslations("upload");
  return (
    <>
      <Link
        href={`/places/${place.slug}`}
        className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 font-semibold text-ocean"
      >
        <ArrowLeft aria-hidden className="size-5" />
        {place.name}
      </Link>
      <h1 className="mt-4 text-3xl sm:text-4xl">{t("pageTitle", { place: place.name })}</h1>
      <p className="mt-2 mb-8 text-ink-muted">{t("intro", { max: UPLOAD_MAX_FILES })}</p>
      <SignInGate title={t("signInFirst")} body={t("signInFirstBody")}>
        <UploadForm place={{ id: place.id, slug: place.slug, name: place.name }} />
      </SignInGate>
    </>
  );
}
