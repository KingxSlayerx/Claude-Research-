"use client";

import type { ReactNode } from "react";

/**
 * Option groups built on native radio inputs: arrow keys move between
 * options, the group is announced with its legend, and state is real form state.
 */
export interface Option<V extends string | number> {
  value: V;
  label: string;
  detail?: ReactNode;
  hint?: string;
  disabled?: boolean;
}

export function OptionGroup<V extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  columns = 2,
  hideLegend = false,
}: {
  legend: string;
  name: string;
  options: Option<V>[];
  value: V;
  onChange: (v: V) => void;
  columns?: 1 | 2 | 3;
  hideLegend?: boolean;
}) {
  const grid = columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-1 min-[420px]:grid-cols-2" : "grid-cols-2 sm:grid-cols-3";
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className={hideLegend ? "sr-only" : "mb-3 text-sm font-medium text-ink"}>{legend}</legend>
      <div className={`grid gap-2 ${grid}`}>
        {options.map((o) => (
          <label key={String(o.value)} className={`relative ${o.disabled ? "opacity-50" : "cursor-pointer"}`}>
            <input
              type="radio"
              className="peer sr-only"
              name={name}
              value={String(o.value)}
              checked={o.value === value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
            />
            <span className="flex h-full flex-col gap-0.5 border border-line bg-paper px-4 py-3 transition-[border-color,background-color,box-shadow] duration-200 hover:border-line-strong peer-checked:border-ink peer-checked:shadow-[inset_0_0_0_1px_var(--color-ink)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[0.95rem] text-ink">{o.label}</span>
                {o.detail != null && <span className="tabular shrink-0 text-sm text-muted">{o.detail}</span>}
              </span>
              {o.hint && <span className="text-[0.8rem] leading-snug text-muted">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export interface Swatch {
  value: string;
  label: string;
  hex: string;
  grain?: boolean;
  detail?: string;
}

export function SwatchGroup({
  legend,
  name,
  swatches,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  swatches: Swatch[];
  value: string;
  onChange: (v: string) => void;
}) {
  const current = swatches.find((s) => s.value === value);
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-3 flex w-full justify-between text-sm">
        <span className="font-medium text-ink">{legend}</span>
        <span className="text-muted" aria-hidden="true">
          {current?.label}
        </span>
      </legend>
      <div className="flex flex-wrap gap-x-3 gap-y-4">
        {swatches.map((s) => (
          <label key={s.value} className="relative flex w-[4.25rem] cursor-pointer flex-col items-center gap-2 text-center">
            <input type="radio" className="peer sr-only" name={name} value={s.value} checked={s.value === value} onChange={() => onChange(s.value)} />
            <span
              aria-hidden="true"
              className="block h-12 w-12 rounded-full border border-black/15 shadow-[inset_0_-6px_10px_rgba(0,0,0,.12)] ring-offset-[3px] ring-offset-ivory transition-shadow peer-checked:ring-[1.5px] peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-olive"
              style={{
                backgroundColor: s.hex,
                backgroundImage: s.grain ? "repeating-linear-gradient(95deg, transparent 0 5px, rgba(0,0,0,.12) 5px 7px)" : undefined,
              }}
            />
            <span className="text-xs leading-tight text-ink-soft peer-checked:font-semibold peer-checked:text-ink">
              {s.label}
              {s.detail && <span className="block font-normal text-muted">{s.detail}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Toggle({ checked, onChange, label, detail }: { checked: boolean; onChange: (v: boolean) => void; label: string; detail?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border border-line bg-paper px-4 py-3">
      <span className="flex flex-col">
        <span className="text-[0.95rem]">{label}</span>
        {detail && <span className="tabular text-sm text-muted">{detail}</span>}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 shrink-0 rounded-full bg-sand transition-colors peer-checked:bg-olive peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-paper after:shadow after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}

export function QtyStepper({ value, onChange, label = "Quantity", size = "md" }: { value: number; onChange: (v: number) => void; label?: string; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-9" : "h-11";
  return (
    <div role="group" aria-label={label} className={`inline-flex items-center rounded-full border border-line-strong ${h}`}>
      <button type="button" className={`${h} w-10 rounded-l-full text-lg hover:bg-stone disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={`Decrease ${label.toLowerCase()}`}>
        −
      </button>
      <output className="tabular min-w-8 text-center" aria-live="polite" aria-label={label}>
        {value}
      </output>
      <button type="button" className={`${h} w-10 rounded-r-full text-lg hover:bg-stone disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={value >= 99} aria-label={`Increase ${label.toLowerCase()}`}>
        +
      </button>
    </div>
  );
}

export function AdviceNote({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel: string; onAction: () => void }) {
  return (
    <div role="note" className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-brass bg-warn-soft px-4 py-3 text-sm">
      <p>
        <span className="font-semibold">{title}:</span> {message}
      </p>
      <button type="button" onClick={onAction} className="rounded-full border border-ink/60 px-3 py-1 text-[0.8rem] hover:bg-ink hover:text-paper">
        {actionLabel}
      </button>
    </div>
  );
}
