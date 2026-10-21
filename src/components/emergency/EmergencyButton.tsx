"use client";

import { Phone, Siren, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { EMERGENCY_CONTACTS } from "@/shared/constants/emergency";
import { cx } from "../ui/cx";

/**
 * Always-available emergency numbers. Native <dialog> gives focus trapping,
 * Esc to close and inert background for free. Bottom sheet on phones, centred on desktop.
 */
export function EmergencyButton({ className }: { className?: string }) {
  const t = useTranslations("emergency");
  const tc = useTranslations("common");
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-haspopup="dialog"
        className={cx(
          "inline-flex min-h-11 items-center gap-1.5 rounded-md border-2 border-danger px-3 text-sm font-bold text-danger hover:bg-danger hover:text-surface",
          className,
        )}
      >
        <Siren aria-hidden className="size-4.5" />
        {t("open")}
      </button>

      <dialog
        ref={ref}
        aria-labelledby="emergency-title"
        onClick={(e) => {
          if (e.target === ref.current) ref.current.close();
        }}
        className="m-0 mt-auto w-full max-w-none rounded-t-xl bg-surface p-0 text-ink backdrop:bg-black/55 sm:m-auto sm:max-w-md sm:rounded-xl"
      >
        <div className="flex flex-col gap-4 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="emergency-title" className="text-2xl">
                {t("title")}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">{t("intro")}</p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label={tc("close")}
              className="tap -mt-2 -mr-2 inline-flex items-center justify-center rounded-md hover:bg-surface-sunk"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <li key={c.key}>
                <a
                  href={`tel:${c.number}`}
                  aria-label={`${t(c.key)}. ${t("call", { number: c.number })}`}
                  className="flex min-h-14 items-center gap-4 rounded-lg border-2 border-line bg-bg px-4 hover:border-danger"
                >
                  <span className="tabular w-[2.8em] shrink-0 font-display text-3xl text-danger">
                    {c.number}
                  </span>
                  <span className="flex-1 leading-snug font-semibold">{t(c.key)}</span>
                  <Phone aria-hidden className="size-5 text-ink-muted" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
