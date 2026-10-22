"use client";

import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaceImage } from "@/shared/schemas/place";
import { Picture } from "@/components/ui/Picture";
import { cx } from "@/components/ui/cx";

/** Hero photo + thumbnail strip + native <dialog> lightbox (keyboard, swipe, focus handling). */
export function Gallery({ images }: { images: PlaceImage[] }) {
  const t = useTranslations("place");
  const tc = useTranslations("common");
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [step]);

  const swipe = useRef<number | null>(null);
  const hero = images[0];
  if (!hero) return null;
  const current = images[index] ?? hero;

  return (
    <>
      <button
        type="button"
        onClick={() => open(0)}
        aria-label={t("openGallery", { index: 1, count })}
        className="group relative block w-full overflow-hidden bg-surface-sunk lg:rounded-xl"
      >
        <Picture
          image={hero}
          sizes="(min-width: 1024px) 1152px, 100vw"
          priority
          className="aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]"
          imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-sm font-semibold text-bg">
          <Images aria-hidden className="size-4" />
          {t("photos", { count })}
        </span>
      </button>

      {count > 1 && (
        <ul aria-label={t("gallery")} className="mt-2 flex gap-2 overflow-x-auto px-4 pb-1 lg:px-0">
          {images.slice(1).map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => open(i + 1)}
                aria-label={t("openGallery", { index: i + 2, count })}
                className="block overflow-hidden rounded-md"
              >
                <Picture image={img} sizes="120px" className="aspect-square w-24" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        aria-label={t("lightbox")}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-[#0d0b09] p-0 text-white backdrop:bg-black"
      >
        <div
          className="flex h-full flex-col"
          onPointerDown={(e) => (swipe.current = e.clientX)}
          onPointerUp={(e) => {
            if (swipe.current === null) return;
            const dx = e.clientX - swipe.current;
            swipe.current = null;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}
        >
          <div className="flex items-center justify-between p-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <p className="tabular px-3 text-sm font-semibold" aria-live="polite">
              {t("photoCounter", { index: index + 1, count })}
            </p>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={tc("close")}
              className="tap inline-flex items-center justify-center rounded-md hover:bg-white/10"
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
            <Picture
              key={current.id}
              image={current}
              sizes="100vw"
              className="max-h-full w-full"
              imgClassName="max-h-[80dvh] object-contain bg-transparent! dark:brightness-100"
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t("previous")}
                  className="tap absolute left-2 inline-flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
                >
                  <ChevronLeft aria-hidden className="size-7" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t("next")}
                  className="tap absolute right-2 inline-flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
                >
                  <ChevronRight aria-hidden className="size-7" />
                </button>
              </>
            )}
          </div>
          <div
            className={cx("p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-sm text-white/80")}
          >
            <p>{current.alt}</p>
            {current.attribution && (
              <p className="mt-1 text-xs text-white/70">
                {t("photoCredit", { credit: current.attribution })}
              </p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
