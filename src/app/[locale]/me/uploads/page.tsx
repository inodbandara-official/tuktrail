import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/shell/AppHeader";
import { MyUploads } from "@/features/uploads/MyUploads";
import { SignInGate } from "@/features/uploads/SignInGate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("myUploads");
  return { title: t("title"), robots: { index: false } };
}

export default async function MyUploadsPage() {
  const t = await getTranslations("myUploads");
  const ta = await getTranslations("auth");
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-4xl">{t("title")}</h1>
        <p className="mt-2 mb-8 text-ink-muted">{t("intro")}</p>
        <Suspense>
          <SignInGate title={ta("signIn")} body={t("signInBody")}>
            <MyUploads />
          </SignInGate>
        </Suspense>
      </main>
    </>
  );
}
