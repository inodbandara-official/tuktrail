"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, ImageOff, XCircle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { myUploadsResponseSchema, type MyUpload } from "@/shared/schemas/uploads";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StateMessage } from "@/components/ui/StateMessage";
import { apiGet, apiSend } from "../api/client";

const STATUS = {
  pending: { tone: "warn", Icon: Clock },
  approved: { tone: "tea", Icon: CheckCircle2 },
  rejected: { tone: "neutral", Icon: XCircle },
} as const;

export function MyUploads() {
  const t = useTranslations("myUploads");
  const tc = useTranslations("common");
  const ts = useTranslations("states");
  const format = useFormatter();
  const qc = useQueryClient();
  const [announce, setAnnounce] = useState("");

  const q = useQuery({
    queryKey: ["me", "uploads"],
    queryFn: ({ signal }) => apiGet("/me/uploads", {}, myUploadsResponseSchema, signal),
  });
  const withdraw = useMutation({
    mutationFn: (id: string) => apiSend("DELETE", `/me/uploads/${id}`, undefined, null),
    onSuccess: () => {
      setAnnounce(t("withdrawn"));
      void qc.invalidateQueries({ queryKey: ["me", "uploads"] });
    },
  });

  if (q.isPending) {
    return (
      <div aria-hidden className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }
  if (q.isError) {
    return (
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
    );
  }
  if (q.data.items.length === 0) {
    return (
      <StateMessage
        kind="empty"
        title={t("empty")}
        body={t("emptyBody")}
        action={
          <Link href="/" className={buttonClasses("primary")}>
            {t("findPlaces")}
          </Link>
        }
      />
    );
  }

  return (
    <>
      <span role="status" className="sr-only">
        {announce}
      </span>
      <ul className="grid gap-4 sm:grid-cols-2">
        {q.data.items.map((u: MyUpload) => {
          const { tone, Icon } = STATUS[u.status];
          return (
            <li key={u.id} className="overflow-hidden rounded-lg border-2 border-line bg-surface">
              {u.thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- presigned/private URLs, pre-sized variants
                <img
                  src={u.thumbUrl}
                  alt={u.caption}
                  loading="lazy"
                  className="aspect-[4/3] w-full bg-surface-sunk object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-surface-sunk p-4 text-center text-sm text-ink-muted">
                  <ImageOff aria-hidden className="size-8" />
                  {t("removedFile")}
                </div>
              )}
              <div className="flex flex-col gap-2 p-4">
                <Badge tone={tone} icon={<Icon aria-hidden className="size-3.5" />} className="self-start">
                  {t(u.status)}
                </Badge>
                <Link
                  href={`/places/${u.place.slug}`}
                  className="font-display text-xl text-ink hover:underline"
                >
                  {u.place.name}
                </Link>
                <p className="text-sm text-ink-muted">
                  {t("sharedOn", { date: format.dateTime(new Date(u.createdAt), { dateStyle: "medium" }) })}
                </p>
                {u.status === "rejected" && u.rejectionReason && (
                  <div className="rounded-md bg-surface-sunk p-3 text-sm">
                    <p>{t(`reasons.${u.rejectionReason}`)}</p>
                    {u.rejectionNote && (
                      <p className="mt-1 text-ink-muted">{t("note", { note: u.rejectionNote })}</p>
                    )}
                  </div>
                )}
                {u.status === "pending" && (
                  <Button
                    variant="quiet"
                    className="self-start"
                    disabled={withdraw.isPending}
                    onClick={() => {
                      if (window.confirm(t("withdrawConfirm"))) withdraw.mutate(u.id);
                    }}
                  >
                    {t("withdraw")}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
