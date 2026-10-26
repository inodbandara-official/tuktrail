import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PlaceEditor } from "@/features/admin/PlaceEditor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.editor");
  return { title: t("editTitle") };
}

async function Editor({ params }: { params: PageProps<"/[locale]/admin/places/[id]">["params"] }) {
  const { id } = await params;
  return <PlaceEditor id={id} />;
}

export default function EditPlacePage({ params }: PageProps<"/[locale]/admin/places/[id]">) {
  return (
    <Suspense>
      <Editor params={params} />
    </Suspense>
  );
}
