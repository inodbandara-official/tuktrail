import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cx } from "./cx";

export function SearchField({
  label,
  className,
  ...rest
}: { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <label className={cx("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-muted"
      />
      <input
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        className="min-h-12 w-full rounded-md border-2 border-line-strong bg-surface pr-3 pl-11 text-base text-ink placeholder:text-ink-muted focus-visible:border-focus"
        {...rest}
      />
    </label>
  );
}
