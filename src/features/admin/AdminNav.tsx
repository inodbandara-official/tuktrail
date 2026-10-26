"use client";

import { useQuery } from "@tanstack/react-query";
import { Camera, LayoutDashboard, MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";
import { adminStatsSchema } from "@/shared/schemas/admin";
import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "@/components/ui/cx";
import { apiGet } from "../api/client";

export const ADMIN_STATS_KEY = ["admin", "stats"] as const;

export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_STATS_KEY,
    queryFn: ({ signal }) => apiGet("/admin/stats", {}, adminStatsSchema, signal),
  });
}

/** Section tabs for the admin area. The photo tab carries the number waiting for review. */
export function AdminNav() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const stats = useAdminStats();
  const pending = stats.data?.pendingPhotos ?? 0;

  const items = [
    { href: "/admin", label: t("overview"), Icon: LayoutDashboard, active: pathname === "/admin" },
    {
      href: "/admin/moderation",
      label: t("photos"),
      Icon: Camera,
      active: pathname.startsWith("/admin/moderation"),
      count: pending,
    },
    {
      href: "/admin/places",
      label: t("places"),
      Icon: MapPinned,
      active: pathname.startsWith("/admin/places"),
    },
  ] as const;

  return (
    <nav aria-label={t("label")} className="-mx-4 mb-8 overflow-x-auto border-b-2 border-line px-4">
      <ul className="flex sm:gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cx(
                "-mb-0.5 flex min-h-12 items-center gap-2 border-b-3 px-2.5 font-semibold whitespace-nowrap sm:px-3",
                item.active
                  ? "border-laterite text-ink"
                  : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {/* Icons only where there is room: all three tabs fit a 390px phone without them. */}
              <item.Icon aria-hidden className="hidden size-5 sm:block" />
              {item.label}
              {"count" in item && item.count > 0 && (
                <span className="tabular rounded-full bg-laterite px-2 py-0.5 text-xs font-bold text-laterite-ink">
                  <span className="sr-only">{t("waiting", { count: item.count })}</span>
                  <span aria-hidden>{item.count}</span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
