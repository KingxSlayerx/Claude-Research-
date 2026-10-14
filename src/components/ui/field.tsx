import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-[12px] border bg-paper px-4 py-3 text-[1rem] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-olive aria-[invalid=true]:border-error";

export function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
  className = "",
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <span id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="text-sm text-error">
          {error}
        </span>
      )}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: boolean) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function TextInput({ invalid, className = "", ...rest }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input aria-invalid={invalid || undefined} className={`${control} border-line ${className}`} {...rest} />;
}

export function TextArea({ invalid, className = "", ...rest }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea aria-invalid={invalid || undefined} className={`${control} border-line ${className}`} {...rest} />;
}

export function Select({ invalid, className = "", children, ...rest }: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={`${control} appearance-none border-line bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%231d1b18%22 stroke-width=%221.3%22/></svg>')] bg-[length:12px_8px] bg-[right_1rem_center] bg-no-repeat pr-10 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}
