"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { authClient } from "../auth/client";

/** Renders children for signed-in users; otherwise a friendly prompt that returns here after sign-in. */
export function SignInGate({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  const t = useTranslations("auth");
  const { data, isPending } = authClient.useSession();
  const pathname = usePathname();

  if (isPending) {
    return (
      <div aria-hidden className="flex flex-col gap-3">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border-2 border-line bg-surface p-6">
        <h2 className="text-2xl">{title}</h2>
        <p className="text-ink-muted">{body}</p>
        <Link
          href={{ pathname: "/sign-in", query: { next: pathname } }}
          className={buttonClasses("primary", "lg")}
        >
          <LogIn aria-hidden className="size-5" />
          {t("signIn")}
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
