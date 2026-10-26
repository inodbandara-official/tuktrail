"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Camera, ChevronRight, FilePen, Plus, ShieldQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { PLACE_STATUSES } from "@/shared/constants/places";
import { adminPlaceListSchema } from "@/shared/schemas/admin";
import { Link } from "@/i18n/navigation";
import { CategoryIcon } from "@/components/places/CategoryIcon";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SearchField } from "@/components/ui/SearchField";
import { Skeleton } from "@/components/ui/Skeleton";
import { StateMessage } from "@/components/ui/StateMessage";
import { apiGet } from "../api/client";

const params = {
  q: parseAsString.withDefault(""),
  status: parseAsStringLiteral(PLACE_STATUSES),
  unverified: parseAsBoolean.withDefault(false),
};

export function AdminPlacesList() {
  const t = useTranslations("admin.places");
  const tc = useTranslations("common");
  const ts = useTranslations("states");
  const tcat = useTranslations("categories");
  const td = useTranslations("districts");
  const [filters, setFilters] = useQueryStates(params);
  const [text, setText] = useState(filters.q);

  // Debounce typing into the URL (and the query).
  useEffect(() => {
    const id = setTimeout(() => void setFilters({ q: text.trim() || null }), 250);
    return () => clearTimeout(id);
  }, [text, setFilters]);

  const q = useQuery({
    queryKey: ["admin", "places", filters],
    queryFn: ({ signal }) =>
      apiGet(
        "/admin/places",
        { q: filters.q, status: filters.status, unverified: filters.unverified ? "true" : undefined },
        adminPlaceListSchema,
        signal,
      ),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">{t("title")}</h1>
          {q.data && (
            <p className="mt-2 text-ink-muted">
              {t("counts", {
                total: q.data.counts.total,
                published: q.data.counts.published,
                draft: q.data.counts.draft,
              })}
            </p>
          )}
        </div>
        <Link href="/admin/places/new" className={buttonClasses("primary")}>
          <Plus aria-hidden className="size-5" />
          {t("new")}
        </Link>
      </div>

      <div className="mt-6 mb-4 flex flex-col gap-3">
        <SearchField
          label={t("search")}
          placeholder={t("searchPlaceholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("filters")}>
          <Chip pressed={!filters.status} onClick={() => void setFilters({ status: null })}>
            {t("all")}
          </Chip>
          {PLACE_STATUSES.map((s) => (
            <Chip key={s} pressed={filters.status === s} onClick={() => void setFilters({ status: s })}>
              {t(`status.${s}`)}
            </Chip>
          ))}
          <Chip
            pressed={filters.unverified}
            icon={<ShieldQuestion aria-hidden className="size-4" />}
            onClick={() => void setFilters({ unverified: filters.unverified ? null : true })}
          >
            {t("onlyUnverified")}
          </Chip>
        </div>
      </div>

      {q.isPending ? (
        <div aria-hidden className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : q.isError ? (
        <StateMessage
          kind="error"
          title={ts("errorTitle")}
          body={ts("errorBody")}
          action={
            <Button variant="secondary" onClick={() => void q.refetch()}>
              {tc("retry")}
            </Button>
          }
        />
      ) : q.data.items.length === 0 ? (
        <StateMessage kind="empty" title={t("none")} body={t("noneBody")} />
      ) : (
        <>
          <p role="status" className="mb-2 text-sm text-ink-muted">
            {t("showing", { count: q.data.items.length })}
          </p>
          <ul className="divide-y-2 divide-line overflow-hidden rounded-lg border-2 border-line bg-surface">
            {q.data.items.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/places/${p.id}`}
                  className="flex min-h-20 items-center gap-4 px-4 py-3 hover:bg-surface-sunk"
                >
                  {p.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- pre-sized 400px variant
                    <img
                      src={p.thumbUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-md bg-surface-sunk object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex size-14 shrink-0 items-center justify-center rounded-md bg-surface-sunk"
                    >
                      <CategoryIcon category={p.category} className="size-6 text-ink-muted" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block truncate text-sm text-ink-muted">
                      {t("meta", { category: tcat(p.category), district: td(p.district) })}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {p.status === "draft" && (
                        <Badge tone="neutral" icon={<FilePen aria-hidden className="size-3.5" />}>
                          {t("status.draft")}
                        </Badge>
                      )}
                      {!p.isVerified && <Badge tone="warn">{t("unverified")}</Badge>}
                      {p.pendingPhotos > 0 && (
                        <Badge tone="laterite" icon={<Camera aria-hidden className="size-3.5" />}>
                          {t("pendingPhotos", { count: p.pendingPhotos })}
                        </Badge>
                      )}
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
