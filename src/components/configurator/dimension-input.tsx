"use client";

import { useId, useState } from "react";
import { BUSINESS_RULES } from "@/domain/catalog";
import { clampDimension } from "@/domain/config";
import { feetInches } from "@/domain/format";

/**
 * Millimetre input. Typing is free; the value is rounded to 10 mm and kept
 * within the manufacturable range when the field is committed (blur or Enter),
 * matching the original site's behaviour.
 */
export function DimensionInput({ kind, value, onCommit }: { kind: "w" | "h"; value: number; onCommit: (v: number) => void }) {
  const id = useId();
  const lim = kind === "w" ? BUSINESS_RULES.width : BUSINESS_RULES.height;
  const [text, setText] = useState(String(value));
  const [note, setNote] = useState<string | null>(null);
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setText(String(value));
  }

  const commit = () => {
    const raw = Number(text.replace(/[^\d.]/g, ""));
    const v = clampDimension(kind, raw, value);
    setNote(raw && raw !== v ? `Adjusted to ${v} mm (${lim.min}–${lim.max} mm, in 10 mm steps).` : null);
    setText(String(v));
    if (v !== value) onCommit(v);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {kind === "w" ? "Width" : "Height"}
      </label>
      <div className="flex items-center rounded-[14px] border border-line bg-paper focus-within:border-olive">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          className="tabular w-full min-w-0 bg-transparent px-4 py-3 outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          aria-describedby={`${id}-hint`}
        />
        <span className="pr-4 text-sm text-muted">mm</span>
      </div>
      <span id={`${id}-hint`} className="tabular text-xs text-muted" aria-live="polite">
        {note ?? `≈ ${feetInches(value)} · ${lim.min}–${lim.max} mm`}
      </span>
    </div>
  );
}
