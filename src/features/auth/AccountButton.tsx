"use client";

import { Images, LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { authClient } from "./client";

/** Header account control: "Sign in" when signed out, an avatar menu when signed in. */
export function AccountButton() {
  const t = useTranslations("auth");
  const { data, isPending } = authClient.useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (isPending) return <span aria-hidden className="inline-block size-11" />;

  if (!data) {
    return (
      <Link
        href={{ pathname: "/sign-in", query: pathname === "/sign-in" ? {} : { next: pathname } }}
        aria-label={t("signIn")}
        className="tap inline-flex items-center justify-center gap-1.5 rounded-md px-2 font-semibold text-ink hover:bg-surface-sunk"
      >
        <UserRound aria-hidden className="size-5" />
        <span className="sr-only sm:not-sr-only">{t("signIn")}</span>
      </Link>
    );
  }

  const name = data.user.name || data.user.email;
  const initial = (name.trim()[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("account", { name })}
        onClick={() => setOpen((o) => !o)}
        className="tap inline-flex items-center justify-center rounded-full"
      >
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full border-2 border-ink bg-ocean-soft font-bold text-ocean"
        >
          {initial}
        </span>
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute top-full right-0 z-40 mt-2 w-60 overflow-hidden rounded-lg border-2 border-line bg-surface shadow-lift"
        >
          <p className="truncate border-b-2 border-line px-4 py-3 text-sm text-ink-muted">
            {data.user.email}
          </p>
          <Link
            href="/me/uploads"
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center gap-3 px-4 font-semibold hover:bg-surface-sunk"
          >
            <Images aria-hidden className="size-5" />
            {t("myUploads")}
          </Link>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await authClient.signOut();
            }}
            className="flex min-h-12 w-full items-center gap-3 px-4 text-left font-semibold hover:bg-surface-sunk"
          >
            <LogOut aria-hidden className="size-5" />
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
