import { defineRouting } from "next-intl/routing";

// English only in v1. Sinhala ("si") and Tamil ("ta") will be added here later.
export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  // English lives at "/", future locales at "/si", "/ta".
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
