import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "./cx";

const control =
  "w-full rounded-md border-2 bg-surface px-3 text-base text-ink placeholder:text-ink-muted focus-visible:border-focus aria-invalid:border-danger";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  /** Shown after the label, e.g. "optional". */
  tag?: string;
  className?: string;
  /** Lets an error summary link straight to the control. */
  id?: string;
}

/** Label + control + hint + error, wired up with aria-describedby / aria-invalid. */
function useField({ id, hint, error }: Pick<FieldProps, "id" | "hint" | "error">) {
  const auto = useId();
  const controlId = id ?? auto;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  return {
    controlId,
    describedBy: [errorId, hintId].filter(Boolean).join(" ") || undefined,
    hintId,
    errorId,
  };
}

function Frame({
  label,
  hint,
  error,
  tag,
  className,
  ids,
  children,
}: FieldProps & { ids: ReturnType<typeof useField>; children: ReactNode }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={ids.controlId} className="font-semibold">
        {label}
        {tag && <span className="ml-2 text-sm font-normal text-ink-muted">{tag}</span>}
      </label>
      {children}
      {hint && (
        <p id={ids.hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={ids.errorId} className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  tag,
  className,
  id,
  ...rest
}: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  const ids = useField({ id, hint, error });
  return (
    <Frame {...{ label, hint, error, tag, className }} ids={ids}>
      <input
        id={ids.controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cx(control, "min-h-12 border-line-strong")}
        {...rest}
      />
    </Frame>
  );
}

export function TextArea({
  label,
  hint,
  error,
  tag,
  className,
  id,
  ...rest
}: FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  const ids = useField({ id, hint, error });
  return (
    <Frame {...{ label, hint, error, tag, className }} ids={ids}>
      <textarea
        id={ids.controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cx(control, "border-line-strong py-2.5 leading-relaxed")}
        {...rest}
      />
    </Frame>
  );
}

export function SelectField({
  label,
  hint,
  error,
  tag,
  className,
  id,
  children,
  ...rest
}: FieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">) {
  const ids = useField({ id, hint, error });
  return (
    <Frame {...{ label, hint, error, tag, className }} ids={ids}>
      <select
        id={ids.controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cx(control, "min-h-12 border-line-strong")}
        {...rest}
      >
        {children}
      </select>
    </Frame>
  );
}
