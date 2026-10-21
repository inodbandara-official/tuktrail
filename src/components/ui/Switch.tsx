"use client";

import { cx } from "./cx";

/** On/off switch. The whole row (track + label text) is the tap target. */
export function Switch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <label className={cx("inline-flex min-h-11 cursor-pointer items-center gap-3 select-none", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors duration-150",
          checked ? "border-tea bg-tea" : "border-line-strong bg-surface-sunk",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "inline-block size-5 rounded-full shadow-sm transition-transform duration-150",
            checked ? "translate-x-5.5 bg-surface" : "translate-x-0.5 bg-ink-muted",
          )}
        />
      </button>
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}
