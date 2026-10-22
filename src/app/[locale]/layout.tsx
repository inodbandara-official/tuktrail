import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers/Providers";
import { InlineScript } from "@/components/theme/InlineScript";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme";
import { bodyFont, headingFont } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    title: { default: `${t("appName")} · ${t("tagline")}`, template: `%s · ${t("appName")}` },
    description: t("description"),
    applicationName: t("appName"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4ECDD" },
    { media: "(prefers-color-scheme: dark)", color: "#16120E" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const t = await getTranslations("common");

  return (
    <html lang={locale} suppressHydrationWarning className={`${headingFont.variable} ${bodyFont.variable}`}>
      <head>
        <InlineScript html={THEME_INIT_SCRIPT} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-ink px-4 py-3 font-semibold text-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:inline-flex focus:min-h-11 focus:items-center"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
