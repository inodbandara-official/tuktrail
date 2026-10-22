"use client";

import { LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useLocationStore } from "./store";

/** Shown once, before the browser's own permission prompt, so the request has context. */
export function LocationExplainer({ onChooseTown }: { onChooseTown: () => void }) {
  const t = useTranslations("location");
  const { setChoice, requestGps } = useLocationStore();

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-bg/70 p-4 backdrop-blur-sm sm:items-center">
      <section
        aria-labelledby="explainer-title"
        className="w-full max-w-md rounded-xl border-2 border-line bg-surface p-6 shadow-lift"
      >
        <svg viewBox="0 0 120 64" width="120" height="64" aria-hidden className="mb-4 text-line-strong">
          <path
            d="M4 50c18-8 32-12 48-13s38 3 64-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M44 36V14" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
          <rect
            x="34"
            y="8"
            width="20"
            height="16"
            rx="10"
            fill="var(--surface)"
            stroke="var(--ink)"
            strokeWidth="2.5"
          />
          <path d="M36 13a10 10 0 0 1 16 0" stroke="var(--laterite)" strokeWidth="5" fill="none" />
          <circle cx="86" cy="34" r="5" fill="var(--ocean)" stroke="var(--surface)" strokeWidth="2.5" />
          <circle
            cx="86"
            cy="34"
            r="12"
            fill="none"
            stroke="var(--ocean)"
            strokeOpacity=".35"
            strokeWidth="2"
          />
        </svg>
        <h2 id="explainer-title" className="text-3xl">
          {t("explainerTitle")}
        </h2>
        <p className="mt-2 text-ink-muted">{t("explainerBody")}</p>
        <p className="mt-4 flex gap-2.5 rounded-md bg-tea-soft p-3 text-sm text-tea">
          <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
          <span>{t("explainerPrivacy")}</span>
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            size="lg"
            icon={<LocateFixed aria-hidden className="size-5" />}
            onClick={() => {
              setChoice("gps");
              requestGps();
            }}
          >
            {t("useMyLocation")}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={<MapPin aria-hidden className="size-5" />}
            onClick={() => {
              setChoice("manual");
              onChooseTown();
            }}
          >
            {t("chooseTown")}
          </Button>
          <Button variant="quiet" className="self-center" onClick={() => setChoice("manual")}>
            {t("startInColombo")}
          </Button>
        </div>
      </section>
    </div>
  );
}
