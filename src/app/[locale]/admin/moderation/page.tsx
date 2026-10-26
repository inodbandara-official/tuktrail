import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ModerationQueue } from "@/features/admin/ModerationQueue";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.moderation");
  return { title: t("title") };
}

export default function ModerationPage() {
  return <ModerationQueue />;
}
