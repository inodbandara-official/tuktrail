import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Camera, FilePen, MapPinned, ShieldQuestion } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createCtx } from "@/server/next/ctx";
import { requireAdminPage } from "@/server/next/session";
import { getAdminStats } from "@/server/services/admin-places";
import { cx } from "@/components/ui/cx";

// Reads the signed-in admin and live counts on every request.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.overview");
  return { title: t("title") };
}

export default async function AdminOverviewPage() {
  const admin = await requireAdminPage();
  const t = await getTranslations("admin.overview");
  const stats = await getAdminStats(createCtx(admin));
  const pending = stats.pendingPhotos;

  const cards = [
    {
      href: "/admin/moderation",
      Icon: Camera,
      value: pending,
      label: t("pendingPhotos", { count: pending }),
      hint: pending ? t("pendingHint") : t("pendingNone"),
      urgent: pending > 0,
    },
    {
      href: "/admin/places",
      Icon: MapPinned,
      value: stats.places.published,
      label: t("published", { count: stats.places.published }),
      hint: t("ofTotal", { total: stats.places.total }),
      urgent: false,
    },
    {
      href: "/admin/places?status=draft",
      Icon: FilePen,
      value: stats.places.draft,
      label: t("drafts", { count: stats.places.draft }),
      hint: t("draftsHint"),
      urgent: false,
    },
    {
      href: "/admin/places?unverified=true",
      Icon: ShieldQuestion,
      value: stats.places.unverified,
      label: t("unverified", { count: stats.places.unverified }),
      hint: t("unverifiedHint"),
      urgent: false,
    },
  ] as const;

  return (
    <>
      <h1 className="text-4xl">{t("heading", { name: admin.name.split(" ")[0] || admin.email })}</h1>
      <p className="mt-2 mb-8 max-w-prose text-ink-muted">{t("intro", { decided: stats.decidedThisWeek })}</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label}>
            <Link
              href={c.href}
              className={cx(
                "group flex h-full flex-col gap-2 rounded-lg border-2 bg-surface p-5 hover:border-ink",
                c.urgent ? "border-laterite" : "border-line",
              )}
            >
              <c.Icon aria-hidden className={cx("size-6", c.urgent ? "text-laterite" : "text-ink-muted")} />
              <span className="tabular font-display text-4xl">{c.value}</span>
              <span className="font-semibold">{c.label}</span>
              <span className="text-sm text-ink-muted">{c.hint}</span>
              <ArrowRight
                aria-hidden
                className="mt-auto size-5 self-end text-ink-muted transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
