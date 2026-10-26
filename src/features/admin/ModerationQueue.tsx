"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Check, ExternalLink, ImageOff, MapPin, Smartphone, Star, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useId, useRef, useState } from "react";
import { IMAGE_STATUSES, REJECTION_REASONS, type RejectionReason } from "@/shared/constants/places";
import {
  moderationListSchema,
  moderationResultSchema,
  REJECTION_NOTE_MAX,
  type ModerationItem,
  type ModerationList,
} from "@/shared/schemas/admin";
import { Link } from "@/i18n/navigation";
import { SpotMap } from "@/components/map/SpotMap";
import { CategoryIcon } from "@/components/places/CategoryIcon";
import { useColorScheme } from "@/components/theme/useColorScheme";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Skeleton } from "@/components/ui/Skeleton";
import { StateMessage } from "@/components/ui/StateMessage";
import { ApiClientError, apiGet, apiSend } from "../api/client";
import { ADMIN_STATS_KEY } from "./AdminNav";

const statusParser = parseAsStringLiteral(IMAGE_STATUSES).withDefault("pending");
type Status = (typeof IMAGE_STATUSES)[number];

function useDistance() {
  const t = useTranslations("common");
  const format = useFormatter();
  return (m: number) =>
    m < 1000
      ? t("mAway", { distance: format.number(Math.round(m / 10) * 10) })
      : t("kmAway", { distance: format.number(m / 1000, { maximumFractionDigits: 1 }) });
}

/** Mounts children only once scrolled near, so a long queue doesn't start a dozen maps at once. */
function WhenVisible({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setVisible(true), {
      rootMargin: "300px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {visible && children}
    </div>
  );
}

export function ModerationQueue() {
  const t = useTranslations("admin.moderation");
  const tc = useTranslations("common");
  const ts = useTranslations("states");
  const [status, setStatus] = useQueryState("status", statusParser);
  const qc = useQueryClient();
  const [announce, setAnnounce] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const key = ["admin", "moderation", status] as const;

  const q = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam, signal }) =>
      apiGet("/admin/moderation", { status, cursor: pageParam }, moderationListSchema, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  /** Drop a decided photo from the list and move focus to the next one (or the heading). */
  const onDecided = (id: string, message: string) => {
    const ids = q.data?.pages.flatMap((p) => p.items.map((i) => i.id)) ?? [];
    const nextId = ids[ids.indexOf(id) + 1] ?? ids[ids.indexOf(id) - 1];
    qc.setQueryData<InfiniteData<ModerationList>>(key, (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((p) => ({
              ...p,
              items: p.items.filter((i) => i.id !== id),
              pendingCount: Math.max(0, p.pendingCount - 1),
            })),
          }
        : data,
    );
    void qc.invalidateQueries({ queryKey: ADMIN_STATS_KEY });
    void qc.invalidateQueries({ queryKey: ["admin", "moderation"], refetchType: "none" });
    setAnnounce(message);
    requestAnimationFrame(() => {
      const next = nextId && listRef.current?.querySelector<HTMLElement>(`[data-item="${nextId}"] h2`);
      (next || headingRef.current)?.focus();
    });
  };

  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const pendingCount = q.data?.pages[0]?.pendingCount;

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 mb-6 max-w-prose text-ink-muted">{t("intro")}</p>

      <div role="group" aria-label={t("filterLabel")} className="mb-6 flex flex-wrap gap-2">
        {IMAGE_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={status === s}
            onClick={() => void setStatus(s === "pending" ? null : s)}
            className={cx(
              "inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold",
              status === s
                ? "border-laterite bg-laterite-soft text-laterite"
                : "border-line bg-surface text-ink hover:border-line-strong",
            )}
          >
            {t(`tabs.${s}`)}
            {s === "pending" && pendingCount !== undefined && (
              <span className="tabular text-sm">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <span role="status" className="sr-only">
        {announce}
      </span>

      {q.isPending ? (
        <div aria-hidden className="flex flex-col gap-4">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : q.isError ? (
        <StateMessage
          kind="error"
          title={ts("errorTitle")}
          body={
            q.error instanceof ApiClientError && q.error.status === 404 ? t("signedOut") : ts("errorBody")
          }
          action={
            <Button variant="secondary" onClick={() => void q.refetch()}>
              {tc("retry")}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <StateMessage
          kind="empty"
          title={t(`empty.${status}`)}
          body={status === "pending" ? t("emptyPendingBody") : t("emptyDecidedBody")}
          className="rounded-xl border-2 border-line bg-surface"
        />
      ) : (
        <ul ref={listRef} className="flex flex-col gap-6">
          {items.map((item) => (
            <li key={item.id} data-item={item.id}>
              <ModerationCard item={item} status={status} onDecided={onDecided} />
            </li>
          ))}
        </ul>
      )}

      {q.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
            {q.isFetchingNextPage ? tc("loading") : t("loadMore")}
          </Button>
        </div>
      )}
    </>
  );
}

function ModerationCard({
  item,
  status,
  onDecided,
}: {
  item: ModerationItem;
  status: Status;
  onDecided: (id: string, message: string) => void;
}) {
  const t = useTranslations("admin.moderation");
  const tcat = useTranslations("categories");
  const tr = useTranslations("myUploads.reasons");
  const format = useFormatter();
  const distance = useDistance();
  const scheme = useColorScheme();
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useMutation({
    mutationFn: (makeHero: boolean) =>
      apiSend("POST", `/admin/images/${item.id}/approve`, { makeHero }, moderationResultSchema),
    onSuccess: (_r, makeHero) =>
      onDecided(
        item.id,
        makeHero
          ? t("approvedHero", { place: item.place.name })
          : t("approvedMsg", { place: item.place.name }),
      ),
    onError: (e) =>
      setError(e instanceof ApiClientError && e.status === 409 ? t("alreadyReviewed") : t("actionFailed")),
  });

  const pending = status === "pending";
  const v = item.verification;
  const within = v ? v.distanceM <= item.place.visitRadiusM : false;
  const busy = approve.isPending;

  return (
    <article className="overflow-clip rounded-xl border-2 border-line bg-surface lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* On wide screens the photo stays in view while the details and reject options scroll. */}
      <div className="bg-surface-sunk lg:relative">
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL of a private rendition
          <img
            src={item.previewUrl}
            alt={item.caption}
            width={item.width}
            height={item.height}
            className="max-h-[70vh] w-full object-contain lg:sticky lg:top-20"
          />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-ink-muted">
            <ImageOff aria-hidden className="size-8" />
            <span className="text-sm">{t("fileRemoved")}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted">
            <CategoryIcon category={item.place.category} className="size-4" />
            {tcat(item.place.category)}
          </p>
          <h2 tabIndex={-1} className="mt-1 text-2xl">
            {item.place.name}
          </h2>
          <Link
            href={`/places/${item.place.slug}`}
            target="_blank"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ocean underline decoration-2 underline-offset-4"
          >
            {t("viewPlace")}
            <ExternalLink aria-hidden className="size-4" />
            <span className="sr-only">{t("newTab")}</span>
          </Link>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="font-semibold text-ink-muted">{t("sharedBy")}</dt>
          <dd className="min-w-0 break-words">
            {item.uploader
              ? t("uploader", { name: item.uploader.name, email: item.uploader.email })
              : t("deletedUser")}
          </dd>
          <dt className="font-semibold text-ink-muted">{t("sharedOn")}</dt>
          <dd>{format.dateTime(new Date(item.createdAt), { dateStyle: "medium", timeStyle: "short" })}</dd>
          <dt className="font-semibold text-ink-muted">{t("caption")}</dt>
          <dd className="break-words">{item.caption}</dd>
          {!pending && item.moderatedAt && (
            <>
              <dt className="font-semibold text-ink-muted">{t("decidedOn")}</dt>
              <dd>
                {format.dateTime(new Date(item.moderatedAt), { dateStyle: "medium", timeStyle: "short" })}
              </dd>
            </>
          )}
          {item.rejectionReason && (
            <>
              <dt className="font-semibold text-ink-muted">{t("reasonLabel")}</dt>
              <dd>
                {t(`reasons.${item.rejectionReason}`)}
                {item.rejectionNote && <span className="block text-ink-muted">{item.rejectionNote}</span>}
              </dd>
            </>
          )}
        </dl>

        {v && (
          <div
            className={cx(
              "flex gap-3 rounded-md border-2 p-3 text-sm",
              within ? "border-tea/40 bg-tea-soft" : "border-warn/40 bg-warn-soft",
            )}
          >
            {v.method === "device" ? (
              <Smartphone aria-hidden className="mt-0.5 size-5 shrink-0" />
            ) : (
              <MapPin aria-hidden className="mt-0.5 size-5 shrink-0" />
            )}
            <p>
              {t(v.method === "device" ? "checkedDevice" : "checkedExif", {
                distance: distance(v.distanceM),
                radius: distance(item.place.visitRadiusM),
              })}
            </p>
          </div>
        )}

        {pending && item.capturePoint && (
          <div>
            <WhenVisible className="h-56 overflow-hidden rounded-lg border-2 border-line">
              <SpotMap
                center={item.place.location}
                radiusM={item.place.visitRadiusM}
                compare={item.capturePoint}
                frameKey={item.id}
                colorScheme={scheme}
                labels={{
                  region: t("mapLabel", { place: item.place.name }),
                  pin: item.place.name,
                  compare: t("takenHere"),
                }}
              />
            </WhenVisible>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-3 w-2.5 rounded-t-full border-2 border-ink bg-ocean"
                />
                {t("legendPlace")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="size-3 rounded-full border-2 border-surface bg-laterite" />
                {t("legendTaken")}
              </span>
              <span>{t("legendPrivacy")}</span>
            </p>
          </div>
        )}

        {pending && item.place.heroIsPlaceholder && (
          <p className="rounded-md bg-ocean-soft p-3 text-sm text-ink">{t("firstPhoto")}</p>
        )}

        {error && (
          <p role="alert" className="rounded-md bg-surface-sunk p-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        {pending && !rejecting && (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button
              icon={<Check aria-hidden className="size-5" />}
              disabled={busy}
              onClick={() => approve.mutate(false)}
            >
              {t("approve")}
            </Button>
            {!item.place.heroIsPlaceholder && (
              <Button
                variant="secondary"
                icon={<Star aria-hidden className="size-5" />}
                disabled={busy}
                onClick={() => approve.mutate(true)}
              >
                {t("approveHero")}
              </Button>
            )}
            <Button
              variant="secondary"
              icon={<X aria-hidden className="size-5" />}
              disabled={busy}
              onClick={() => {
                setError(null);
                setRejecting(true);
              }}
            >
              {t("reject")}
            </Button>
          </div>
        )}

        {pending && rejecting && (
          <RejectPanel
            item={item}
            onCancel={() => setRejecting(false)}
            onDone={(reason) => onDecided(item.id, t("rejectedMsg", { reason: tr(reason) }))}
          />
        )}
      </div>
    </article>
  );
}

function RejectPanel({
  item,
  onCancel,
  onDone,
}: {
  item: ModerationItem;
  onCancel: () => void;
  onDone: (reason: RejectionReason) => void;
}) {
  const t = useTranslations("admin.moderation");
  const tr = useTranslations("myUploads.reasons");
  const [reason, setReason] = useState<RejectionReason | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const legendId = useId();
  const noteId = useId();
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => firstRef.current?.focus(), []);

  const reject = useMutation({
    mutationFn: () =>
      apiSend(
        "POST",
        `/admin/images/${item.id}/reject`,
        { reason, note: note.trim() || undefined },
        moderationResultSchema,
      ),
    onSuccess: () => onDone(reason!),
    onError: (e) =>
      setError(e instanceof ApiClientError && e.status === 409 ? t("alreadyReviewed") : t("actionFailed")),
  });

  const needsNote = reason === "other" && note.trim().length < 3;

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border-2 border-line-strong p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason) return setError(t("pickReason"));
        if (needsNote) return setError(t("noteRequired"));
        setError(null);
        reject.mutate();
      }}
    >
      <fieldset aria-labelledby={legendId} className="flex flex-col gap-1">
        <legend id={legendId} className="mb-1 font-semibold">
          {t("whyReject")}
        </legend>
        {REJECTION_REASONS.map((r, i) => (
          <label
            key={r}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-surface-sunk"
          >
            <input
              ref={i === 0 ? firstRef : undefined}
              type="radio"
              name={`reason-${item.id}`}
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="mt-0.5 size-5 accent-laterite"
            />
            <span>
              <span className="block font-semibold">{t(`reasons.${r}`)}</span>
              <span className="block text-sm text-ink-muted">{tr(r)}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label htmlFor={noteId} className="font-semibold">
        {reason === "other" ? t("noteRequiredLabel") : t("noteLabel")}
      </label>
      <textarea
        id={noteId}
        value={note}
        maxLength={REJECTION_NOTE_MAX}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="rounded-md border-2 border-line-strong bg-surface p-3 text-base"
      />
      <p className="-mt-2 text-xs text-ink-muted">{t("noteHint")}</p>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={reject.isPending}>
          {t("confirmReject")}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={reject.isPending}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
