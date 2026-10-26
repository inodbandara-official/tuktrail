import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PlaceForm } from "@/features/admin/PlaceForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.editor");
  return { title: t("newTitle") };
}

export default async function NewPlacePage() {
  const t = await getTranslations("admin.editor");
  return (
    <>
      <Link
        href="/admin/places"
        className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 font-semibold text-ocean"
      >
        <ArrowLeft aria-hidden className="size-5" />
        {t("back")}
      </Link>
      <h1 className="mt-2 mb-2 text-4xl">{t("newTitle")}</h1>
      <p className="mb-6 max-w-prose text-ink-muted">{t("newIntro")}</p>
      <PlaceForm />
    </>
  );
}
