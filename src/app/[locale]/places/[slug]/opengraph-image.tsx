import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getCachedPlace } from "@/server/next/places";
import { COLOR_TOKENS, CATEGORY_TONE } from "@/shared/design/tokens";

// Brand name is not translated.
const BRAND = { first: "Tuk", second: "Trail" } as const;

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TukTrail place card";

/** Typographic share card in the brand palette (no third-party imagery). */
export default async function OgImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const place = await getCachedPlace(slug);
  // Route-handler context: next/root-params isn't available, so pass the locale explicitly.
  const t = await getTranslations({ locale });
  const c = COLOR_TOKENS.light;
  const accent = place ? c[CATEGORY_TONE[place.category]] : c.laterite;
  const name = place?.name ?? t("meta.appName");
  const meta = place
    ? `${t(`categories.${place.category}`)} · ${t(`districts.${place.district}`)}, Sri Lanka`
    : t("meta.tagline");

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: c.bg,
        padding: 72,
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 44,
            height: 64,
            borderRadius: "22px 22px 4px 4px",
            border: `4px solid ${c.ink}`,
            background: c.surface,
            overflow: "hidden",
          }}
        >
          <div style={{ height: 16, background: c.laterite }} />
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: c.ink }}>
          {BRAND.first}
          <span style={{ color: c.laterite }}>{BRAND.second}</span>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1 }} />
      <div
        style={{
          display: "flex",
          width: 120,
          height: 10,
          background: accent,
          borderRadius: 5,
          marginBottom: 28,
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: name.length > 28 ? 72 : 92,
          lineHeight: 1.02,
          color: c.ink,
          fontWeight: 700,
        }}
      >
        {name}
      </div>
      <div style={{ display: "flex", marginTop: 24, fontSize: 36, color: c["ink-muted"] }}>{meta}</div>
    </div>,
    size,
  );
}
