"use client";

import { useMutation } from "@tanstack/react-query";
import { Crosshair, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { DISTRICTS_BY_PROVINCE, PROVINCES, SRI_LANKA_BOUNDS } from "@/shared/constants/geography";
import {
  DEFAULT_VISIT_RADIUS_M,
  PLACE_CATEGORIES,
  SHORT_DESCRIPTION_MAX,
  type PlaceStatus,
} from "@/shared/constants/places";
import { placeSavedSchema, type AdminPlace } from "@/shared/schemas/admin";
import { placeInputSchema, WEEKDAYS, type PlaceInput } from "@/shared/schemas/place";
import { slugify } from "@/shared/lib/slug";
import { Link, useRouter } from "@/i18n/navigation";
import { SpotMap } from "@/components/map/SpotMap";
import { useColorScheme } from "@/components/theme/useColorScheme";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cx } from "@/components/ui/cx";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { ApiClientError, apiSend } from "../api/client";

type Weekday = (typeof WEEKDAYS)[number];
type DayMode = "unknown" | "closed" | "open";
interface DayState {
  mode: DayMode;
  ranges: { open: string; close: string }[];
}

interface FormState {
  name: string;
  slug: string;
  slugTouched: boolean;
  category: string;
  district: string;
  lat: string;
  lng: string;
  visitRadiusM: string;
  shortDescription: string;
  fullDescription: string;
  feeForeignLkr: string;
  feeLocalLkr: string;
  hours: Record<Weekday, DayState>;
  hoursNotes: string;
  dressCode: string;
  howToGetThere: string;
  safetyNotes: string;
  bestMonths: number[];
  isVerified: boolean;
  status: PlaceStatus;
}

const ISLAND_CENTRE = { lat: 7.8731, lng: 80.7718 };
const MAX_RANGES = 4;

function initialState(place?: AdminPlace): FormState {
  const weekly = place?.openingHours?.weekly ?? {};
  const hours = Object.fromEntries(
    WEEKDAYS.map((d) => {
      const r = weekly[d];
      const mode: DayMode = r === undefined ? "unknown" : r.length === 0 ? "closed" : "open";
      return [d, { mode, ranges: r?.length ? r.map((x) => ({ ...x })) : [{ open: "", close: "" }] }];
    }),
  ) as Record<Weekday, DayState>;
  const str = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
  return {
    name: place?.name ?? "",
    slug: place?.slug ?? "",
    slugTouched: Boolean(place),
    category: place?.category ?? "",
    district: place?.district ?? "",
    lat: str(place?.location.lat),
    lng: str(place?.location.lng),
    visitRadiusM: str(place?.visitRadiusM ?? DEFAULT_VISIT_RADIUS_M),
    shortDescription: place?.shortDescription ?? "",
    fullDescription: place?.fullDescription ?? "",
    feeForeignLkr: str(place?.feeForeignLkr),
    feeLocalLkr: str(place?.feeLocalLkr),
    hours,
    hoursNotes: place?.openingHours?.notes ?? "",
    dressCode: place?.dressCode ?? "",
    howToGetThere: place?.howToGetThere ?? "",
    safetyNotes: place?.safetyNotes ?? "",
    bestMonths: place?.bestMonths ?? [],
    isVerified: place?.isVerified ?? false,
    status: place?.status ?? "draft",
  };
}

const orNull = (s: string) => (s.trim() === "" ? null : s.trim());
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

/** Form state → API payload (validated by the same shared schema the server uses). */
function toPayload(s: FormState): unknown {
  const weekly: Record<string, { open: string; close: string }[]> = {};
  for (const d of WEEKDAYS) {
    const day = s.hours[d];
    if (day.mode === "closed") weekly[d] = [];
    if (day.mode === "open") weekly[d] = day.ranges.filter((r) => r.open || r.close);
  }
  const hasHours = Object.keys(weekly).length > 0 || s.hoursNotes.trim() !== "";
  return {
    name: s.name,
    slug: s.slug,
    category: s.category || undefined,
    district: s.district || undefined,
    location: {
      lat: s.lat.trim() === "" ? NaN : Number(s.lat),
      lng: s.lng.trim() === "" ? NaN : Number(s.lng),
    },
    visitRadiusM: numOrNull(s.visitRadiusM) ?? NaN,
    shortDescription: s.shortDescription,
    fullDescription: s.fullDescription,
    openingHours: hasHours
      ? { weekly, ...(s.hoursNotes.trim() ? { notes: s.hoursNotes.trim() } : {}) }
      : null,
    feeForeignLkr: numOrNull(s.feeForeignLkr),
    feeLocalLkr: numOrNull(s.feeLocalLkr),
    dressCode: orNull(s.dressCode),
    howToGetThere: orNull(s.howToGetThere),
    bestMonths: s.bestMonths,
    safetyNotes: orNull(s.safetyNotes),
    isVerified: s.isVerified,
    status: s.status,
  };
}

const FIELD_ORDER = [
  "name",
  "slug",
  "category",
  "district",
  "location",
  "visitRadiusM",
  "shortDescription",
  "fullDescription",
  "feeForeignLkr",
  "feeLocalLkr",
  "openingHours",
  "dressCode",
  "howToGetThere",
  "safetyNotes",
] as const;
type FieldKey = (typeof FIELD_ORDER)[number];
type Errors = Partial<Record<FieldKey, string>>;

function inSriLanka(lat: number, lng: number) {
  const b = SRI_LANKA_BOUNDS;
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

export function PlaceForm({ place, onSaved }: { place?: AdminPlace; onSaved?: () => void }) {
  const t = useTranslations("admin.form");
  const tcat = useTranslations("categories");
  const td = useTranslations("districts");
  const tp = useTranslations("provinces");
  const tm = useTranslations("months");
  const tw = useTranslations("weekdays");
  const router = useRouter();
  const scheme = useColorScheme();
  const [s, setS] = useState(() => initialState(place));
  const [saved, setSaved] = useState(() => JSON.stringify(initialState(place)));
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");
  const [frame, setFrame] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(s) !== saved;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setS((p) => ({ ...p, [key]: value }));

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const lat = Number(s.lat);
  const lng = Number(s.lng);
  const hasPoint =
    s.lat.trim() !== "" &&
    s.lng.trim() !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    inSriLanka(lat, lng);
  const radius = Math.min(Math.max(Number(s.visitRadiusM) || DEFAULT_VISIT_RADIUS_M, 50), 50_000);
  const center = useMemo(() => (hasPoint ? { lat, lng } : ISLAND_CENTRE), [hasPoint, lat, lng]);

  const save = useMutation({
    mutationFn: (payload: PlaceInput) =>
      place
        ? apiSend("PUT", `/admin/places/${place.id}`, payload, placeSavedSchema)
        : apiSend("POST", "/admin/places", payload, placeSavedSchema),
    onSuccess: (res) => {
      setSaved(JSON.stringify(s));
      if (!place) {
        router.push(`/admin/places/${res.id}?created=1`);
        return;
      }
      setStatus(t("saved"));
      onSaved?.();
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        const fe = (err.details as { fieldErrors?: Record<string, unknown> } | undefined)?.fieldErrors ?? {};
        if (err.code === "CONFLICT" && "slug" in fe) return showErrors({ slug: t("errors.slugTaken") });
        if ("location" in fe) return showErrors({ location: t("errors.location") });
        const keys = FIELD_ORDER.filter((k) => k in fe);
        if (keys.length) return showErrors(Object.fromEntries(keys.map((k) => [k, t(`errors.${k}`)])));
        if (err.status === 404) return setStatus(t("errors.signedOut"));
      }
      setStatus(t("errors.saveFailed"));
    },
  });

  function showErrors(e: Errors) {
    setErrors(e);
    setStatus("");
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    const parsed = placeInputSchema.safeParse(toPayload(s));
    const next: Errors = {};
    if (!parsed.success) {
      const fe = z.flattenError(parsed.error).fieldErrors as Record<string, unknown>;
      for (const k of FIELD_ORDER) if (k in fe) next[k] = t(`errors.${k}`);
    }
    if (hasPoint === false && !next.location) next.location = t("errors.location");
    if (Object.keys(next).length || !parsed.success) return showErrors(next);
    setErrors({});
    save.mutate(parsed.data);
  }

  const errorEntries = FIELD_ORDER.flatMap((k) => (errors[k] ? [[k, errors[k]] as const] : []));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8">
      {errorEntries.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border-2 border-danger bg-surface p-4"
        >
          <h2 className="text-xl">{t("errorSummary", { count: errorEntries.length })}</h2>
          <ul className="mt-2 list-disc pl-5">
            {errorEntries.map(([k, msg]) => (
              <li key={k}>
                <a href={`#f-${k}`} className="font-semibold text-danger underline underline-offset-4">
                  {msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Section title={t("basics")}>
        <TextField
          id="f-name"
          label={t("name")}
          value={s.name}
          error={errors.name}
          autoComplete="off"
          onChange={(e) => {
            const name = e.target.value;
            setS((p) => ({ ...p, name, slug: p.slugTouched ? p.slug : slugify(name) }));
          }}
        />
        <TextField
          id="f-slug"
          label={t("slug")}
          hint={t("slugHint", { slug: s.slug || "…" })}
          value={s.slug}
          error={errors.slug}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setS((p) => ({ ...p, slug: e.target.value.toLowerCase(), slugTouched: true }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="f-category"
            label={t("category")}
            value={s.category}
            error={errors.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">{t("choose")}</option>
            {PLACE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tcat(c)}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="f-district"
            label={t("district")}
            hint={t("districtHint")}
            value={s.district}
            error={errors.district}
            onChange={(e) => set("district", e.target.value)}
          >
            <option value="">{t("choose")}</option>
            {PROVINCES.map((p) => (
              <optgroup key={p} label={tp(p)}>
                {DISTRICTS_BY_PROVINCE[p].map((d) => (
                  <option key={d} value={d}>
                    {td(d)}
                  </option>
                ))}
              </optgroup>
            ))}
          </SelectField>
        </div>
      </Section>

      <Section title={t("location")} description={t("locationIntro")}>
        <div className="h-72 overflow-hidden rounded-lg border-2 border-line sm:h-96">
          <SpotMap
            center={center}
            radiusM={radius}
            editable
            frameKey={`${frame}`}
            colorScheme={scheme}
            onChange={(p) => setS((prev) => ({ ...prev, lat: p.lat.toFixed(6), lng: p.lng.toFixed(6) }))}
            labels={{ region: t("mapLabel"), pin: hasPoint ? t("pinLabel") : t("pinUnset") }}
          />
        </div>
        <p className="flex items-start gap-2 text-sm text-ink-muted">
          <Crosshair aria-hidden className="mt-0.5 size-4 shrink-0" />
          {hasPoint ? t("mapHint") : t("mapHintUnset")}
        </p>
        <div id="f-location" tabIndex={-1} className="grid gap-4 sm:grid-cols-3">
          <TextField
            label={t("lat")}
            inputMode="decimal"
            value={s.lat}
            error={errors.location}
            onChange={(e) => set("lat", e.target.value)}
            onBlur={() => setFrame((f) => f + 1)}
          />
          <TextField
            label={t("lng")}
            inputMode="decimal"
            value={s.lng}
            onChange={(e) => set("lng", e.target.value)}
            onBlur={() => setFrame((f) => f + 1)}
          />
          <TextField
            id="f-visitRadiusM"
            label={t("radius")}
            hint={t("radiusHint")}
            inputMode="numeric"
            value={s.visitRadiusM}
            error={errors.visitRadiusM}
            onChange={(e) => set("visitRadiusM", e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => setFrame((f) => f + 1)}
          />
        </div>
      </Section>

      <Section title={t("descriptions")}>
        <TextArea
          id="f-shortDescription"
          label={t("short")}
          hint={t("shortHint", { count: s.shortDescription.length, max: SHORT_DESCRIPTION_MAX })}
          value={s.shortDescription}
          error={errors.shortDescription}
          maxLength={SHORT_DESCRIPTION_MAX}
          rows={3}
          onChange={(e) => set("shortDescription", e.target.value)}
        />
        <TextArea
          id="f-fullDescription"
          label={t("full")}
          tag={t("optional")}
          hint={t("fullHint")}
          value={s.fullDescription}
          error={errors.fullDescription}
          rows={10}
          onChange={(e) => set("fullDescription", e.target.value)}
        />
      </Section>

      <Section title={t("practical")} description={t("practicalIntro")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="f-feeForeignLkr"
            label={t("feeForeign")}
            tag={t("optional")}
            inputMode="numeric"
            value={s.feeForeignLkr}
            error={errors.feeForeignLkr}
            onChange={(e) => set("feeForeignLkr", e.target.value.replace(/[^\d]/g, ""))}
          />
          <TextField
            id="f-feeLocalLkr"
            label={t("feeLocal")}
            tag={t("optional")}
            inputMode="numeric"
            value={s.feeLocalLkr}
            error={errors.feeLocalLkr}
            onChange={(e) => set("feeLocalLkr", e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>
        <p className="-mt-2 text-sm text-ink-muted">{t("feeHint")}</p>

        <fieldset id="f-openingHours" tabIndex={-1} className="flex flex-col gap-2">
          <legend className="mb-1 font-semibold">
            {t("hours")}
            <span className="ml-2 text-sm font-normal text-ink-muted">{t("optional")}</span>
          </legend>
          {errors.openingHours && <p className="text-sm font-semibold text-danger">{errors.openingHours}</p>}
          <ul className="divide-y-2 divide-line rounded-lg border-2 border-line">
            {WEEKDAYS.map((d) => (
              <DayRow
                key={d}
                label={tw(d)}
                day={s.hours[d]}
                onChange={(day) => setS((p) => ({ ...p, hours: { ...p.hours, [d]: day } }))}
              />
            ))}
          </ul>
          <TextField
            label={t("hoursNotes")}
            tag={t("optional")}
            value={s.hoursNotes}
            maxLength={500}
            onChange={(e) => set("hoursNotes", e.target.value)}
          />
        </fieldset>

        <TextArea
          id="f-dressCode"
          label={t("dressCode")}
          tag={t("optional")}
          value={s.dressCode}
          error={errors.dressCode}
          rows={2}
          onChange={(e) => set("dressCode", e.target.value)}
        />
        <TextArea
          id="f-howToGetThere"
          label={t("howToGetThere")}
          tag={t("optional")}
          hint={t("howToGetThereHint")}
          value={s.howToGetThere}
          error={errors.howToGetThere}
          rows={4}
          onChange={(e) => set("howToGetThere", e.target.value)}
        />
        <TextArea
          id="f-safetyNotes"
          label={t("safety")}
          tag={t("optional")}
          value={s.safetyNotes}
          error={errors.safetyNotes}
          rows={2}
          onChange={(e) => set("safetyNotes", e.target.value)}
        />

        <fieldset>
          <legend className="mb-1 font-semibold">{t("bestMonths")}</legend>
          <p className="mb-2 text-sm text-ink-muted">{t("bestMonthsHint")}</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const on = s.bestMonths.includes(m);
              return (
                <Chip
                  key={m}
                  pressed={on}
                  onClick={() =>
                    set(
                      "bestMonths",
                      on ? s.bestMonths.filter((x) => x !== m) : [...s.bestMonths, m].sort((a, b) => a - b),
                    )
                  }
                >
                  {tm(String(m))}
                </Chip>
              );
            })}
          </div>
        </fieldset>
      </Section>

      <Section title={t("publishing")}>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-semibold">{t("visibility")}</legend>
          {(["draft", "published"] as const).map((v) => (
            <label
              key={v}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-surface-sunk"
            >
              <input
                type="radio"
                name="status"
                value={v}
                checked={s.status === v}
                onChange={() => set("status", v)}
                className="mt-0.5 size-5 accent-laterite"
              />
              <span>
                <span className="block font-semibold">{t(`status.${v}`)}</span>
                <span className="block text-sm text-ink-muted">{t(`status.${v}Hint`)}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div>
          <Switch checked={s.isVerified} onChange={(v) => set("isVerified", v)} label={t("verified")} />
          <p className="text-sm text-ink-muted">{t("verifiedHint")}</p>
        </div>
      </Section>

      {/* Save bar: stays in the thumb zone on phones. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t-2 border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <Button type="submit" icon={<Save aria-hidden className="size-5" />} disabled={save.isPending}>
          {save.isPending ? t("saving") : place ? t("save") : t("create")}
        </Button>
        {place?.status === "published" && (
          <Link
            href={`/places/${place.slug}`}
            target="_blank"
            className="inline-flex min-h-11 items-center gap-1 font-semibold text-ocean underline decoration-2 underline-offset-4"
          >
            {t("viewPublic")}
            <ExternalLink aria-hidden className="size-4" />
            <span className="sr-only">{t("newTab")}</span>
          </Link>
        )}
        <p role="status" className={cx("text-sm font-semibold", dirty ? "text-warn" : "text-ink-muted")}>
          {status || (dirty ? t("unsaved") : "")}
        </p>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border-2 border-line bg-surface p-5 sm:p-6">
      <div>
        <h2 className="text-2xl">{title}</h2>
        {description && <p className="mt-1 max-w-prose text-sm text-ink-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function DayRow({ label, day, onChange }: { label: string; day: DayState; onChange: (d: DayState) => void }) {
  const t = useTranslations("admin.form");
  return (
    <li className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
      <div className="flex items-center gap-3 sm:w-64">
        <span className="w-24 font-semibold">{label}</span>
        <select
          aria-label={t("dayMode", { day: label })}
          value={day.mode}
          onChange={(e) => onChange({ ...day, mode: e.target.value as DayMode })}
          className="min-h-11 flex-1 rounded-md border-2 border-line-strong bg-surface px-2"
        >
          <option value="unknown">{t("dayUnknown")}</option>
          <option value="closed">{t("dayClosed")}</option>
          <option value="open">{t("dayOpen")}</option>
        </select>
      </div>
      {day.mode === "open" && (
        <div className="flex flex-1 flex-col gap-2">
          {day.ranges.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="time"
                aria-label={t("opensAt", { day: label })}
                value={r.open}
                onChange={(e) =>
                  onChange({
                    ...day,
                    ranges: day.ranges.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)),
                  })
                }
                className="tabular min-h-11 rounded-md border-2 border-line-strong bg-surface px-2"
              />
              <span aria-hidden>–</span>
              <input
                type="time"
                aria-label={t("closesAt", { day: label })}
                value={r.close}
                onChange={(e) =>
                  onChange({
                    ...day,
                    ranges: day.ranges.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)),
                  })
                }
                className="tabular min-h-11 rounded-md border-2 border-line-strong bg-surface px-2"
              />
              {day.ranges.length > 1 && (
                <button
                  type="button"
                  aria-label={t("removeTimes", { day: label })}
                  onClick={() => onChange({ ...day, ranges: day.ranges.filter((_, j) => j !== i) })}
                  className="tap inline-flex items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunk"
                >
                  <Trash2 aria-hidden className="size-5" />
                </button>
              )}
            </div>
          ))}
          {day.ranges.length < MAX_RANGES && (
            <button
              type="button"
              onClick={() => onChange({ ...day, ranges: [...day.ranges, { open: "", close: "" }] })}
              className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-ocean"
            >
              <Plus aria-hidden className="size-4" />
              {t("addTimes", { day: label })}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
