import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmergencyButton } from "../emergency/EmergencyButton";
import { ThemeToggle } from "../theme/ThemeToggle";
import { Wordmark } from "./Wordmark";

export function AppHeader() {
  const t = useTranslations("meta");
  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link
          href="/"
          className="tap -ml-1 inline-flex items-center rounded-md px-1"
          aria-label={t("appName")}
        >
          <Wordmark />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <EmergencyButton />
        </div>
      </div>
    </header>
  );
}
