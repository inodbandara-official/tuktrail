import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppHeader } from "@/components/shell/AppHeader";
import { StateMessage } from "@/components/ui/StateMessage";

export default function NotFound() {
  const t = useTranslations("states");
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-16">
        <StateMessage
          kind="empty"
          title={t("notFoundTitle")}
          body={t("notFoundBody")}
          action={
            <Link
              href="/"
              className="tap inline-flex items-center font-semibold text-ocean underline decoration-2 underline-offset-4"
            >
              {t("goHome")}
            </Link>
          }
        />
      </main>
    </>
  );
}
