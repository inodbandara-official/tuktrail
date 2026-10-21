import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { StateMessage } from "@/components/ui/StateMessage";

// Phase 1 placeholder. Phase 2 replaces this with the nearby map + list.
export default function HomePage() {
  const t = useTranslations();
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl">{t("home.title")}</h1>
        <StateMessage
          kind="empty"
          title={t("states.emptyTitle")}
          body={t("home.comingSoon")}
          action={
            <Link
              href="/design"
              className="tap inline-flex items-center font-semibold text-ocean underline decoration-2 underline-offset-4"
            >
              {t("home.viewDesign")}
            </Link>
          }
        />
      </main>
    </>
  );
}
