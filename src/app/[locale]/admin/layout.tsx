import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { requireAdminPage } from "@/server/next/session";
import { AppHeader } from "@/components/shell/AppHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdminNav } from "@/features/admin/AdminNav";

// Every admin view depends on who is signed in, so there is no instant static shell to validate.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return {
    title: { template: `%s · ${t("title")}`, default: t("title") },
    robots: { index: false, follow: false },
  };
}

/** Everything below renders only for admins; anyone else gets the ordinary not-found page. */
async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdminPage();
  // The root layout leaves the admin strings out of public pages; admins get all of them.
  return (
    <NextIntlClientProvider messages={await getMessages()}>
      <AdminNav />
      {children}
    </NextIntlClientProvider>
  );
}

function AdminSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 pt-4 pb-24">
        <Suspense fallback={<AdminSkeleton />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </>
  );
}
