"use client";

/**
 * Inline script that runs on hard loads only. Per the Next.js "preventing flash" guide,
 * the type flips to text/plain on the client so React doesn't warn about rendering <script>.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
