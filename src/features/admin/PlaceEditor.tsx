"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, ImagePlus, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import { UPLOAD_CONTENT_TYPES } from "@/shared/constants/places";
import { adminImageSchema, adminPlaceSchema, type AdminImage, type AdminPlace } from "@/shared/schemas/admin";
import { UPLOAD_MAX_BYTES } from "@/shared/schemas/uploads";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { StateMessage } from "@/components/ui/StateMessage";
import { Switch } from "@/components/ui/Switch";
import { ApiClientError, apiGet, apiSend } from "../api/client";
import { ADMIN_STATS_KEY } from "./AdminNav";
import { PlaceForm } from "./PlaceForm";

export function PlaceEditor({ id }: { id: string }) {
  const t = useTranslations("admin.editor");
  const tc = useTranslations("common");
  const ts = useTranslations("states");
  const created = useSearchParams().get("created") === "1";
  const qc = useQueryClient();
  const key = ["admin", "place", id] as const;

  const q = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => apiGet(`/admin/places/${id}`, {}, adminPlaceSchema, signal),
    // Keep the form's own state stable while editing.
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <Link
        href="/admin/places"
        className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 font-semibold text-ocean"
      >
        <ArrowLeft aria-hidden className="size-5" />
        {t("back")}
      </Link>
      {q.isPending ? (
        <div aria-hidden className="mt-4 flex flex-col gap-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : q.isError ? (
        <StateMessage
          kind={q.error instanceof ApiClientError && q.error.status === 404 ? "empty" : "error"}
          title={
            q.error instanceof ApiClientError && q.error.status === 404 ? t("notFound") : ts("errorTitle")
          }
          body={ts("errorBody")}
          action={
            <Button variant="secondary" onClick={() => void q.refetch()}>
              {tc("retry")}
            </Button>
          }
        />
      ) : (
        <>
          <h1 className="mt-2 text-4xl">{q.data.name}</h1>
          {created && (
            <p role="status" className="mt-3 rounded-md bg-tea-soft p-3 font-semibold text-tea">
              {t("created")}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-8">
            <ImagesManager place={q.data} onChange={() => void qc.invalidateQueries({ queryKey: key })} />
            <PlaceForm
              key={q.data.id}
              place={q.data}
              onSaved={() => {
                void qc.invalidateQueries({ queryKey: key });
                void qc.invalidateQueries({ queryKey: ["admin", "places"] });
                void qc.invalidateQueries({ queryKey: ADMIN_STATS_KEY });
              }}
            />
            <DangerZone place={q.data} />
          </div>
        </>
      )}
    </>
  );
}

function ImagesManager({ place, onChange }: { place: AdminPlace; onChange: () => void }) {
  const t = useTranslations("admin.images");
  const [announce, setAnnounce] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pending = place.images.filter((i) => i.status === "pending").length;

  const hero = useMutation({
    mutationFn: (img: AdminImage) =>
      apiSend("POST", `/admin/places/${place.id}/hero`, { imageId: img.id }, null),
    onSuccess: () => {
      setAnnounce(t("heroSet"));
      onChange();
    },
    onError: () => setError(t("failed")),
  });
  const remove = useMutation({
    mutationFn: (img: AdminImage) => apiSend("DELETE", `/admin/images/${img.id}`, undefined, null),
    onSuccess: () => {
      setAnnounce(t("deleted"));
      onChange();
    },
    onError: () => setError(t("failed")),
  });
  const busy = hero.isPending || remove.isPending;
  const shown = place.images.filter((i) => i.status === "approved");

  return (
    <section className="flex flex-col gap-4 rounded-xl border-2 border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl">{t("title", { count: shown.length })}</h2>
        {pending > 0 && (
          <Link
            href="/admin/moderation"
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ocean underline decoration-2 underline-offset-4"
          >
            <Camera aria-hidden className="size-4" />
            {t("pending", { count: pending })}
          </Link>
        )}
      </div>
      <span role="status" className="sr-only">
        {announce}
      </span>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {shown.length === 0 ? (
        <p className="text-ink-muted">{t("none")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((img) => (
            <li key={img.id} className="flex flex-col overflow-hidden rounded-lg border-2 border-line">
              {img.thumbUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- pre-sized 400px variant
                <img
                  src={img.thumbUrl}
                  alt={img.alt}
                  className="aspect-[4/3] w-full bg-surface-sunk object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {img.isHero && (
                    <Badge tone="laterite" icon={<Star aria-hidden className="size-3.5" />}>
                      {t("hero")}
                    </Badge>
                  )}
                  <Badge tone={img.source === "official" ? "ocean" : "tea"}>
                    {img.isPlaceholder ? t("placeholder") : t(`source.${img.source}`)}
                  </Badge>
                </div>
                {img.attribution && !img.isPlaceholder && (
                  <p className="text-sm break-words text-ink-muted">
                    {t("credit", { author: img.attribution, license: img.license ?? t("noLicense") })}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-x-3">
                  {!img.isHero && (
                    <Button variant="quiet" disabled={busy} onClick={() => hero.mutate(img)}>
                      {t("makeHero")}
                    </Button>
                  )}
                  <Button
                    variant="quiet"
                    className="text-danger"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(t("deleteConfirm"))) remove.mutate(img);
                    }}
                  >
                    <Trash2 aria-hidden className="size-4" />
                    {t("delete")}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <OfficialUpload placeId={place.id} onUploaded={(msg) => (setAnnounce(msg), onChange())} />
    </section>
  );
}

function OfficialUpload({ placeId, onUploaded }: { placeId: string; onUploaded: (msg: string) => void }) {
  const t = useTranslations("admin.images");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [makeHero, setMakeHero] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileId = useId();

  const upload = useMutation({
    mutationFn: (fd: FormData) => apiSend("POST", `/admin/places/${placeId}/images`, fd, adminImageSchema),
    onSuccess: () => {
      formRef.current?.reset();
      setMakeHero(false);
      setOpen(false);
      onUploaded(t("uploaded"));
    },
    onError: (e) =>
      setError(
        e instanceof ApiClientError && e.code === "UNSUPPORTED_MEDIA"
          ? t("badType")
          : e instanceof ApiClientError && e.code === "VALIDATION_FAILED"
            ? t("missingFields")
            : t("failed"),
      ),
  });

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="self-start"
        icon={<ImagePlus aria-hidden className="size-5" />}
        onClick={() => setOpen(true)}
      >
        {t("add")}
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-4 rounded-lg border-2 border-line-strong p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const file = fd.get("file");
        if (!(file instanceof File) || file.size === 0) return setError(t("chooseFile"));
        if (file.size > UPLOAD_MAX_BYTES) return setError(t("tooBig"));
        fd.set("makeHero", String(makeHero));
        setError(null);
        upload.mutate(fd);
      }}
    >
      <h3 className="text-xl">{t("addTitle")}</h3>
      <p className="-mt-2 text-sm text-ink-muted">{t("addIntro")}</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fileId} className="font-semibold">
          {t("file")}
        </label>
        <input
          id={fileId}
          name="file"
          type="file"
          accept={UPLOAD_CONTENT_TYPES.join(",")}
          className="min-h-12 rounded-md border-2 border-dashed border-line-strong bg-surface p-2 text-sm file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-surface-sunk file:px-3 file:font-semibold"
        />
      </div>
      <TextField name="alt" label={t("alt")} hint={t("altHint")} required minLength={3} maxLength={200} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="attribution"
          label={t("attribution")}
          hint={t("attributionHint")}
          required
          maxLength={200}
        />
        <TextField
          name="license"
          label={t("license")}
          tag={t("optional")}
          hint={t("licenseHint")}
          maxLength={100}
        />
      </div>
      <TextField name="sourceUrl" type="url" label={t("sourceUrl")} tag={t("optional")} inputMode="url" />
      <Switch checked={makeHero} onChange={setMakeHero} label={t("makeHeroOnUpload")} />
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={upload.isPending}>
          {upload.isPending ? t("uploading") : t("upload")}
        </Button>
        <Button variant="secondary" disabled={upload.isPending} onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function DangerZone({ place }: { place: AdminPlace }) {
  const t = useTranslations("admin.editor");
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const del = useMutation({
    mutationFn: () => apiSend("DELETE", `/admin/places/${place.id}`, undefined, null),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      router.push("/admin/places");
    },
    onError: () => setError(t("deleteFailed")),
  });

  return (
    <section className="flex flex-col items-start gap-3 rounded-xl border-2 border-danger/50 bg-surface p-5 sm:p-6">
      <h2 className="text-2xl">{t("dangerTitle")}</h2>
      <p className="max-w-prose text-sm text-ink-muted">
        {place.status === "published" ? t("dangerHintPublished") : t("dangerHint")}
      </p>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={del.isPending}
        onClick={() => {
          if (window.confirm(t("deleteConfirm", { name: place.name }))) del.mutate();
        }}
        className={buttonClasses("secondary", "md", "border-danger text-danger hover:border-danger")}
      >
        <Trash2 aria-hidden className="size-5" />
        {t("delete")}
      </button>
    </section>
  );
}
