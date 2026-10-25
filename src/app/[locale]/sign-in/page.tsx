import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/shell/AppHeader";
import { isGoogleConfigured } from "@/server/auth/auth";
import { SignInForm } from "@/features/auth/SignInForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signIn"), robots: { index: false } };
}

export default async function SignInPage() {
  const t = await getTranslations("auth");
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-4xl">{t("pageTitle")}</h1>
        <p className="mt-3 mb-8 text-ink-muted">{t("intro")}</p>
        <Suspense>
          <SignInForm googleEnabled={isGoogleConfigured()} />
        </Suspense>
      </main>
    </>
  );
}
