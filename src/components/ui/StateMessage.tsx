import type { ReactNode } from "react";
import { cx } from "./cx";

type Kind = "empty" | "error" | "offline";

/** Line drawings: an empty road, a washed-out road, a road with no signal. Inherit currentColor. */
function Illustration({ kind }: { kind: Kind }) {
  return (
    <svg viewBox="0 0 160 96" width="160" height="96" aria-hidden className="text-line-strong">
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 70c22-10 40-14 60-16s48 2 88-8" />
        <path d="M30 88c18-16 34-26 50-30s30-4 50-12" opacity=".6" />
        <path d="M14 56c10-14 22-22 34-22s18 8 30 8 22-14 34-14 22 10 34 16" opacity=".45" />
        {kind === "empty" && (
          <>
            <path d="M108 30v24" />
            <path d="M102 30h12" className="text-laterite" stroke="var(--laterite)" strokeWidth="5" />
            <rect x="102" y="30" width="12" height="16" rx="6" />
          </>
        )}
        {kind === "error" && (
          <>
            <path d="M70 56l8 6-6 8 8 6" stroke="var(--danger)" />
            <path d="M96 22l4 8h-8z" stroke="var(--warn)" />
          </>
        )}
        {kind === "offline" && (
          <>
            <path d="M106 34a16 16 0 0 1 22 0" />
            <path d="M111 40a9 9 0 0 1 12 0" />
            <circle cx="117" cy="46" r="1.5" fill="currentColor" />
            <path d="M102 28l30 26" stroke="var(--danger)" />
          </>
        )}
      </g>
    </svg>
  );
}

export function StateMessage({
  kind,
  title,
  body,
  action,
  className,
}: {
  kind: Kind;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cx("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}
    >
      <Illustration kind={kind} />
      <h3 className="text-xl">{title}</h3>
      <p className="max-w-[34ch] text-sm text-ink-muted">{body}</p>
      {action}
    </div>
  );
}
