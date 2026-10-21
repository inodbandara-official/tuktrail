import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  pressed: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/** Toggle chip for filters. State is conveyed by aria-pressed, a check-weight border and fill — not colour alone. */
export function Chip({ pressed, icon, children, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cx(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-150",
        pressed
          ? "border-laterite bg-laterite-soft text-laterite"
          : "border-line bg-surface text-ink hover:border-line-strong",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
