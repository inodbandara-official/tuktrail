import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type Variant = "primary" | "secondary" | "quiet";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold select-none transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-laterite text-laterite-ink hover:bg-[color-mix(in_oklab,var(--laterite),var(--ink)_14%)]",
  secondary: "border-2 border-line-strong bg-surface text-ink hover:border-ink hover:bg-surface-sunk",
  quiet: "text-ocean underline decoration-2 underline-offset-4 hover:decoration-ocean/60 px-1",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-4 text-base",
  lg: "min-h-13 px-6 text-lg",
};

/** Button styling for other elements (e.g. next-intl <Link>). */
export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cx(
    base,
    variants[variant],
    variant !== "quiet" && sizes[size],
    variant === "quiet" && "min-h-11",
    className,
  );
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className,
  type = "button",
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(
        base,
        variants[variant],
        variant !== "quiet" && sizes[size],
        variant === "quiet" && "min-h-11",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/** Same look as Button, for navigation and external links (e.g. Google Maps deep links). */
export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  children,
  className,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cx(
        base,
        variants[variant],
        variant !== "quiet" && sizes[size],
        variant === "quiet" && "min-h-11",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </a>
  );
}
