import { Bus, CalendarRange, CircleAlert, Clock, Shirt, ShieldAlert, Ticket } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { WEEKDAYS, type PlaceDetail } from "@/shared/schemas/place";
import { formatDistance } from "@/shared/lib/geo";
import { cx } from "@/components/ui/cx";

function Row({
  icon,
  title,
  children,
  tone,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tone?: "warn";
}) {
  return (
    <div className="flex gap-3 border-t-2 border-line py-4 first:border-t-0 first:pt-0">
      <span aria-hidden className={cx("mt-0.5 shrink-0", tone === "warn" ? "text-warn" : "text-ink-muted")}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-sm font-bold tracking-wide text-ink-muted uppercase">{title}</h3>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

/** Twelve month cells; good months filled. Shapes + text, not colour alone. */
async function MonthStrip({ months }: { months: number[] }) {
  const t = await getTranslations("months");
  const good = new Set(months);
  return (
    <ol className="grid grid-cols-12 gap-0.5" aria-label={months.map((m) => t(String(m))).join(", ")}>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
        <li
          key={m}
          aria-hidden
          title={t(String(m))}
          className={cx(
            "flex h-9 items-center justify-center rounded-sm text-xs font-bold",
            good.has(m) ? "bg-tea text-surface" : "bg-surface-sunk text-ink-muted",
          )}
        >
          {t(String(m)).charAt(0)}
        </li>
      ))}
    </ol>
  );
}

export async function PracticalInfo({ place }: { place: PlaceDetail }) {
  const t = await getTranslations("place");
  const tc = await getTranslations("common");
  const tw = await getTranslations("weekdays");
  const hasFees = place.feeForeignLkr !== null || place.feeLocalLkr !== null;
  const hours = place.openingHours;
  const town = place.nearestTown;
  const townDistance = town ? formatDistance(town.distanceM) : null;

  return (
    <section aria-labelledby="practical-title" className="rounded-xl border-2 border-line bg-surface p-5">
      <h2 id="practical-title" className="mb-4 text-2xl">
        {t("practical")}
      </h2>

      <Row icon={<CalendarRange className="size-5" />} title={t("bestMonths")}>
        {place.bestMonths.length ? (
          <>
            <MonthStrip months={place.bestMonths} />
            <p className="mt-2 text-sm text-ink-muted">{t("bestMonthsHint")}</p>
          </>
        ) : (
          <p>{t("bestMonthsNone")}</p>
        )}
      </Row>

      {hours && (
        <Row icon={<Clock className="size-5" />} title={t("openingHours")}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {WEEKDAYS.map((d) => {
              const slots = hours.weekly[d];
              return (
                <div key={d} className="contents">
                  <dt className="font-semibold">{tw(d)}</dt>
                  <dd className="tabular">
                    {slots === undefined
                      ? t("unknownDay")
                      : slots.length === 0
                        ? t("closed")
                        : slots.map((s) => `${s.open}–${s.close}`).join(", ")}
                  </dd>
                </div>
              );
            })}
          </dl>
          {hours.notes && <p className="mt-2 text-sm text-ink-muted">{hours.notes}</p>}
        </Row>
      )}

      {hasFees && (
        <Row icon={<Ticket className="size-5" />} title={t("fees")}>
          <dl className="grid grid-cols-[1fr_auto] gap-y-1">
            {place.feeForeignLkr !== null && (
              <>
                <dt>{t("feeForeign")}</dt>
                <dd className="tabular font-semibold">
                  {t("lkr", { amount: place.feeForeignLkr.toLocaleString("en-LK") })}
                </dd>
              </>
            )}
            {place.feeLocalLkr !== null && (
              <>
                <dt>{t("feeLocal")}</dt>
                <dd className="tabular font-semibold">
                  {t("lkr", { amount: place.feeLocalLkr.toLocaleString("en-LK") })}
                </dd>
              </>
            )}
          </dl>
        </Row>
      )}

      {place.dressCode && (
        <Row icon={<Shirt className="size-5" />} title={t("dressCode")}>
          <p>{place.dressCode}</p>
        </Row>
      )}

      {(place.howToGetThere || town) && (
        <Row icon={<Bus className="size-5" />} title={t("howToGetThere")}>
          {place.howToGetThere && <p>{place.howToGetThere}</p>}
          {town && townDistance && (
            <p className="mt-2 text-sm font-semibold text-ink-muted">
              {t("nearestTown", {
                town: town.name,
                distance:
                  townDistance.unit === "m"
                    ? tc("mAway", { distance: townDistance.value })
                    : tc("kmAway", { distance: townDistance.value }),
              })}
            </p>
          )}
        </Row>
      )}

      {place.safetyNotes && (
        <Row icon={<ShieldAlert className="size-5" />} title={t("safety")} tone="warn">
          <p>{place.safetyNotes}</p>
        </Row>
      )}

      {(!hasFees || !hours) && (
        <Row icon={<CircleAlert className="size-5" />} title={t("notListedTitle")}>
          <p className="text-sm text-ink-muted">{t("notListedBody")}</p>
        </Row>
      )}
    </section>
  );
}
