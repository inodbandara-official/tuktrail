"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/** The full text is server-rendered (good for SEO and no-JS); this only toggles its visibility. */
export function ReadMore({ children }: { children: ReactNode }) {
  const t = useTranslations("place");
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div>
      <div id={id} hidden={!open} className="mt-4">
        {children}
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-ocean underline decoration-2 underline-offset-4"
      >
        {open ? t("readLess") : t("readMore")}
        <ChevronDown aria-hidden className={cx("size-5 transition-transform", open && "rotate-180")} />
      </button>
    </div>
  );
}
