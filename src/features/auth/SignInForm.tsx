"use client";

import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { authClient, safeNext } from "./client";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

const RESEND_AFTER_S = 30;

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const linkError = params.get("error");
  const [state, setState] = useState<State>(
    linkError ? { kind: "error", message: t("linkExpired") } : { kind: "idle" },
  );
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const send = async (address: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setState({ kind: "error", message: t("invalidEmail") });
      return;
    }
    setState({ kind: "sending" });
    const { error } = await authClient.signIn.magicLink({
      email: address,
      callbackURL: next,
      errorCallbackURL: `/sign-in?error=link&next=${encodeURIComponent(next)}`,
    });
    if (error) {
      setState({ kind: "error", message: error.status === 429 ? t("tooMany") : t("failed") });
      return;
    }
    setState({ kind: "sent", email: address });
    setCooldown(RESEND_AFTER_S);
  };

  if (state.kind === "sent") {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-3 rounded-lg border-2 border-line bg-surface p-5"
      >
        <MailCheck aria-hidden className="size-8 text-tea" />
        <h2 className="text-2xl">{t("checkEmailTitle")}</h2>
        <p>{t("checkEmailBody", { email: state.email })}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={cooldown > 0} onClick={() => void send(state.email)}>
            {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
          </Button>
          <Button variant="quiet" onClick={() => setState({ kind: "idle" })}>
            {t("useDifferentEmail")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          // Read from the DOM, not state: keeps anything typed before hydration (slow connections).
          void send(String(new FormData(e.currentTarget).get("email") ?? "").trim());
        }}
        className="flex flex-col gap-3"
      >
        <label htmlFor="email" className="font-semibold">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
          aria-invalid={state.kind === "error"}
          aria-describedby={state.kind === "error" ? "signin-error" : "signin-privacy"}
          className="min-h-12 w-full rounded-md border-2 border-line-strong bg-surface px-4 text-base placeholder:text-ink-muted focus-visible:border-focus"
        />
        {state.kind === "error" && (
          <p id="signin-error" role="alert" className="text-sm font-semibold text-danger">
            {state.message}
          </p>
        )}
        <Button type="submit" size="lg" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? t("sending") : t("sendLink")}
        </Button>
        <p id="signin-privacy" className="text-sm text-ink-muted">
          {t("privacy")}
        </p>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-sm text-ink-muted" aria-hidden>
            <span className="h-0.5 flex-1 bg-line" />
            {t("or")}
            <span className="h-0.5 flex-1 bg-line" />
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => void authClient.signIn.social({ provider: "google", callbackURL: next })}
          >
            {t("google")}
          </Button>
        </>
      )}
    </div>
  );
}
