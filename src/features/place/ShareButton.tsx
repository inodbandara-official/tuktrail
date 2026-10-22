"use client";

import { Check, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

/** Web Share API on phones; copy-link fallback elsewhere, with a spoken confirmation. */
export function ShareButton({ title, text }: { title: string; text: string }) {
  const t = useTranslations("place");
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const id = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(id);
  }, [status]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // user cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => void share()}
        icon={
          status === "copied" ? (
            <Check aria-hidden className="size-5" />
          ) : (
            <Share2 aria-hidden className="size-5" />
          )
        }
      >
        {status === "copied" ? t("linkCopied") : t("share")}
      </Button>
      <span role="status" className="sr-only">
        {status === "copied" ? t("linkCopied") : status === "failed" ? t("copyFailed") : ""}
      </span>
    </>
  );
}
