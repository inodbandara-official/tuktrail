import type { ReactNode } from "react";
import { cx } from "./cx";

type Tone = "neutral" | "tea" | "ocean" | "laterite" | "warn";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-sunk text-ink-muted",
  tea: "bg-tea-soft text-tea",
  ocean: "bg-ocean-soft text-ocean",
  laterite: "bg-laterite-soft text-laterite",
  warn: "bg-warn-soft text-warn",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
