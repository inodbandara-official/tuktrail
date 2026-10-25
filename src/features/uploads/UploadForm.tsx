"use client";

import { CheckCircle2, ImagePlus, MapPinOff, TriangleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { UPLOAD_CONTENT_TYPES } from "@/shared/constants/places";
import { formatDistance } from "@/shared/lib/geo";
import {
  CAPTION_MAX,
  UPLOAD_MAX_BYTES,
  UPLOAD_MAX_FILES,
  outsideRadiusDetailsSchema,
  presignResponseSchema,
  submissionResponseSchema,
  type OutsideRadiusDetails,
} from "@/shared/schemas/uploads";
import { Link } from "@/i18n/navigation";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { cx } from "@/components/ui/cx";
import { ApiClientError, apiSend } from "../api/client";

interface Picked {
  file: File;
  url: string;
  problem?: "type" | "size";
}

type Phase =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "uploading"; index: number; progress: number }
  | { kind: "verifying" }
  | { kind: "done" }
  | { kind: "outside"; details: OutsideRadiusDetails }
  | { kind: "error"; message: string };

/** Device fix for verification only (high accuracy, sent in the request body, never stored in the URL). */
function getDevicePosition(): Promise<{ lat: number; lng: number; accuracyM: number } | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    ),
  );
}

/** PUT with progress events (fetch has no upload progress). */
function putWithProgress(url: string, file: File, contentType: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

export function UploadForm({ place }: { place: { id: string; slug: string; name: string } }) {
  const t = useTranslations("upload");
  const tc = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [caption, setCaption] = useState("");
  const [useLocation, setUseLocation] = useState(true);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [notice, setNotice] = useState<string | null>(null);
  const problemRef = useRef<HTMLDivElement>(null);

  // On phones the explanation can be below the fold: bring it into view and move focus there.
  useEffect(() => {
    if (phase.kind !== "outside" && phase.kind !== "error") return;
    const el = problemRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  }, [phase.kind]);

  // Free object URLs when previews go away.
  const urls = useMemo(() => picked.map((p) => p.url), [picked]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const add = (files: FileList | null) => {
    if (!files) return;
    const next = [...picked];
    for (const file of Array.from(files)) {
      if (next.length >= UPLOAD_MAX_FILES) {
        setNotice(t("tooMany", { max: UPLOAD_MAX_FILES }));
        break;
      }
      const problem = !(UPLOAD_CONTENT_TYPES as readonly string[]).includes(file.type)
        ? "type"
        : file.size > UPLOAD_MAX_BYTES
          ? "size"
          : undefined;
      next.push({ file, url: URL.createObjectURL(file), problem });
    }
    setPicked(next);
    setPhase({ kind: "idle" });
  };

  const valid = picked.filter((p) => !p.problem);
  const busy = phase.kind === "locating" || phase.kind === "uploading" || phase.kind === "verifying";
  const failing = phase.kind === "outside" ? new Set(phase.details.failingFiles) : new Set<number>();

  const submit = async () => {
    setNotice(null);
    try {
      let device = null;
      if (useLocation) {
        setPhase({ kind: "locating" });
        device = await getDevicePosition();
        if (!device) setNotice(t("locationDenied"));
      }
      const { uploads } = await apiSend(
        "POST",
        "/uploads/presign",
        { placeId: place.id, files: valid.map((p) => ({ contentType: p.file.type, size: p.file.size })) },
        presignResponseSchema,
      );
      for (const [i, u] of uploads.entries()) {
        setPhase({ kind: "uploading", index: i, progress: 0 });
        try {
          await putWithProgress(u.uploadUrl, valid[i]!.file, valid[i]!.file.type, (p) =>
            setPhase({ kind: "uploading", index: i, progress: p }),
          );
        } catch {
          setPhase({ kind: "error", message: t("uploadFailed", { index: i + 1 }) });
          return;
        }
      }
      setPhase({ kind: "verifying" });
      await apiSend(
        "POST",
        "/submissions",
        {
          placeId: place.id,
          intentIds: uploads.map((u) => u.intentId),
          device,
          caption: caption || undefined,
        },
        submissionResponseSchema,
      );
      setPhase({ kind: "done" });
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "OUTSIDE_VISIT_RADIUS") {
        const details = outsideRadiusDetailsSchema.safeParse(err.details);
        if (details.success) {
          setPhase({ kind: "outside", details: details.data });
          return;
        }
      }
      if (err instanceof ApiClientError && err.code === "RATE_LIMITED") {
        setPhase({ kind: "error", message: t("rateLimited") });
        return;
      }
      setPhase({ kind: "error", message: err instanceof ApiClientError ? err.message : t("failed") });
    }
  };

  const fmt = (m: number) => {
    const d = formatDistance(m);
    return d.unit === "m" ? tc("mAway", { distance: d.value }) : tc("kmAway", { distance: d.value });
  };

  if (phase.kind === "done") {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-3 rounded-xl border-2 border-tea bg-tea-soft p-6 text-tea"
      >
        <CheckCircle2 aria-hidden className="size-9" />
        <h2 className="text-2xl text-ink">{t("successTitle")}</h2>
        <p className="text-ink">{t("successBody")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/me/uploads" className={buttonClasses("primary")}>
            {t("seeMyUploads")}
          </Link>
          <Link href={`/places/${place.slug}`} className={buttonClasses("secondary")}>
            {t("backToPlace", { place: place.name })}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid.length && !busy) void submit();
      }}
      className="flex flex-col gap-6"
    >
      <input
        ref={inputRef}
        id="photos"
        type="file"
        multiple
        accept={UPLOAD_CONTENT_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />

      {picked.length === 0 ? (
        <label
          htmlFor="photos"
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line-strong bg-surface p-6 text-center hover:border-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus"
        >
          <ImagePlus aria-hidden className="size-10 text-laterite" />
          <span className="text-lg font-bold">{t("choose")}</span>
          <span className="text-sm text-ink-muted">{t("exifHint")}</span>
        </label>
      ) : (
        <div>
          <p className="mb-2 text-sm font-semibold" aria-live="polite">
            {t("selected", { count: picked.length })}
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {picked.map((p, i) => {
              const validIndex = valid.indexOf(p);
              const hasProblem = p.problem || (validIndex >= 0 && failing.has(validIndex));
              return (
                <li
                  key={p.url}
                  className={cx(
                    "relative overflow-hidden rounded-lg border-2 bg-surface",
                    hasProblem ? "border-warn" : "border-line",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                  <img src={p.url} alt="" className="aspect-[4/3] w-full object-cover" />
                  <p className="truncate px-2 py-1.5 text-xs text-ink-muted">{p.file.name}</p>
                  {hasProblem && (
                    <p className="flex items-center gap-1 px-2 pb-2 text-xs font-bold text-warn">
                      <TriangleAlert aria-hidden className="size-3.5" />
                      {p.problem === "type"
                        ? t("badType", { name: p.file.name })
                        : p.problem === "size"
                          ? t("tooBig", { name: p.file.name })
                          : t("fileProblem")}
                    </p>
                  )}
                  {phase.kind === "uploading" && validIndex === phase.index && (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-1.5 bg-laterite transition-[width]"
                      style={{ width: `${Math.round(phase.progress * 100)}%` }}
                    />
                  )}
                  {!busy && (
                    <button
                      type="button"
                      onClick={() => setPicked(picked.filter((x) => x !== p))}
                      aria-label={t("remove", { index: i + 1 })}
                      className="tap absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-ink/75 text-bg hover:bg-ink"
                    >
                      <X aria-hidden className="size-5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {picked.length < UPLOAD_MAX_FILES && !busy && (
            <label
              htmlFor="photos"
              className={cx(buttonClasses("secondary"), "mt-3 cursor-pointer has-[:focus-visible]:outline-3")}
            >
              <ImagePlus aria-hidden className="size-5" />
              {t("chooseMore")}
            </label>
          )}
        </div>
      )}

      {notice && (
        <p role="status" className="rounded-md bg-surface-sunk p-3 text-sm">
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="caption" className="font-semibold">
          {t("captionLabel")}
        </label>
        <textarea
          id="caption"
          rows={2}
          maxLength={CAPTION_MAX}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          aria-describedby="caption-hint"
          className="w-full rounded-md border-2 border-line-strong bg-surface p-3 text-base focus-visible:border-focus"
        />
        <p id="caption-hint" className="text-sm text-ink-muted">
          {t("captionHint")}
        </p>
      </div>

      <div>
        <Switch checked={useLocation} onChange={setUseLocation} label={t("useLocation")} />
        <p className="mt-1 text-sm text-ink-muted">{t("useLocationHint")}</p>
      </div>

      <div ref={problemRef} tabIndex={-1} className="outline-none">
        {phase.kind === "outside" && (
          <div role="alert" className="flex gap-3 rounded-lg border-2 border-warn bg-warn-soft p-4 text-ink">
            <MapPinOff aria-hidden className="mt-0.5 size-6 shrink-0 text-warn" />
            <div className="flex flex-col gap-1.5">
              <p className="font-bold">{t("outsideTitle", { place: phase.details.placeName })}</p>
              <p>{t("outsideBody", { radius: fmt(phase.details.radiusM) })}</p>
              <p>
                {phase.details.closestM !== null
                  ? t("outsideClosest", { distance: fmt(phase.details.closestM) })
                  : t("outsideNoData")}
              </p>
              <p className="text-sm text-ink-muted">{t("outsideHelp")}</p>
            </div>
          </div>
        )}
        {phase.kind === "error" && (
          <p role="alert" className="rounded-md border-2 border-danger p-3 font-semibold text-danger">
            {phase.message}
          </p>
        )}
      </div>

      <div aria-live="polite" className="text-sm font-semibold text-ink-muted">
        {phase.kind === "locating" && t("locating")}
        {phase.kind === "uploading" && t("uploading", { index: phase.index + 1, count: valid.length })}
        {phase.kind === "verifying" && t("verifying")}
      </div>

      <Button type="submit" size="lg" disabled={!valid.length || busy}>
        {t("submit", { count: valid.length || picked.length || 1 })}
      </Button>
    </form>
  );
}
