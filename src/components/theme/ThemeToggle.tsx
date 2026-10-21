"use client";

import { Moon, Sun, SunMoon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeTheme,
  type ThemePreference,
} from "./theme";

const ORDER: ThemePreference[] = ["system", "light", "dark"];
const ICON = { system: SunMoon, light: Sun, dark: Moon } as const;

function useThemePreference() {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
}

/** Cycles device → light → dark. The label always names the current state. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("theme");
  const pref = useThemePreference();
  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length]!;
  const Icon = ICON[pref];

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`${t("label")}: ${t(pref)}`}
      title={`${t("label")}: ${t(pref)}`}
      className={
        className ?? "tap inline-flex items-center justify-center rounded-md text-ink hover:bg-surface-sunk"
      }
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}

/** Explicit three-way control, used on the design page and (later) settings. */
export function ThemeSegmented() {
  const t = useTranslations("theme");
  const pref = useThemePreference();

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="inline-flex rounded-md border-2 border-line-strong bg-surface p-0.5"
    >
      {ORDER.map((p) => {
        const Icon = ICON[p];
        const active = p === pref;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => applyTheme(p)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-sm px-3 text-sm font-semibold ${
              active ? "bg-ink text-bg" : "text-ink hover:bg-surface-sunk"
            }`}
          >
            <Icon aria-hidden className="size-4" />
            {t(p)}
          </button>
        );
      })}
    </div>
  );
}
