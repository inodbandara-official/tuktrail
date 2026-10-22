import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/shell/AppHeader";
import { PlaceCardSkeleton } from "@/components/ui/Skeleton";
import { NearbyScreen } from "@/features/nearby/NearbyScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nearby");
  return { title: t("title") };
}

/** Static shell shown while the client reads the URL and location (same geometry as the real screen). */
function NearbyFallback() {
  return (
    <div className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-surface-sunk lg:grid lg:grid-cols-[26rem_1fr]">
      <div className="absolute inset-x-0 bottom-0 flex h-[55%] flex-col gap-3 rounded-t-xl border-t-2 border-line bg-surface p-4 pt-9 lg:static lg:h-full lg:rounded-none lg:border-t-0 lg:border-r-2">
        <div className="h-12 rounded-md bg-surface-sunk" />
        <PlaceCardSkeleton />
        <PlaceCardSkeleton />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main id="main">
        <h1 className="sr-only">
          <HomeTitle />
        </h1>
        <Suspense fallback={<NearbyFallback />}>
          <NearbyScreen />
        </Suspense>
      </main>
    </>
  );
}

async function HomeTitle() {
  const t = await getTranslations("nearby");
  return t("title");
}
