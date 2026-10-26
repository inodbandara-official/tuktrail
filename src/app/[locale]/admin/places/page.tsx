import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPlacesList } from "@/features/admin/AdminPlacesList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.places");
  return { title: t("title") };
}

export default function AdminPlacesPage() {
  return <AdminPlacesList />;
}
