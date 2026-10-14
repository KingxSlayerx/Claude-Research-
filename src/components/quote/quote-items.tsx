"use client";

import Link from "next/link";
import { getRoom, getStyle } from "@/domain/catalog";
import { priceDoor } from "@/domain/pricing";
import { summarize } from "@/domain/summary";
import { inr } from "@/domain/format";
import { useQuoteStore, type QuoteItem } from "@/state/quote-store";
import { DoorArt } from "@/components/ui/door-art";
import { toast } from "@/components/ui/toast";
import { QtyStepper } from "@/components/configurator/options";

export function QuoteItems({ items, disabled }: { items: QuoteItem[]; disabled?: boolean }) {
  const duplicateItem = useQuoteStore((s) => s.duplicateItem);
  const removeItem = useQuoteStore((s) => s.removeItem);
  const restoreItem = useQuoteStore((s) => s.restoreItem);
  const setItemQty = useQuoteStore((s) => s.setItemQty);

  return (
    <ol className="flex flex-col border-t border-line" aria-label="Doors in your quote">
      {items.map((it, i) => {
        const s = getStyle(it.config.style);
        const est = priceDoor(it.config);
        return (
          <li key={it.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-5 gap-y-4 border-b border-line py-6 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
            <div className="row-span-2 aspect-[4/5] bg-[#e8e0d2] sm:row-span-1">
              <DoorArt config={it.config} mode="mini" decorative className="h-full w-full" />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="eyebrow">
                {i + 1}. {getRoom(it.config.room).label}
              </p>
              <h3 className="font-display text-[1.75rem] leading-tight">{s.name}</h3>
              <p className="text-[0.82rem] leading-relaxed text-muted">{summarize(it.config)}</p>
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <Link href={`/design?edit=${it.id}`} className="link-underline" aria-disabled={disabled} tabIndex={disabled ? -1 : undefined}>
                  Edit<span className="sr-only"> {s.name}, item {i + 1}</span>
                </Link>
                <button type="button" disabled={disabled} className="link-underline disabled:opacity-50" onClick={() => duplicateItem(it.id)}>
                  Duplicate<span className="sr-only"> {s.name}, item {i + 1}</span>
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  className="link-underline disabled:opacity-50"
                  onClick={() => {
                    removeItem(it.id);
                    toast(`Removed ${s.name}`, { label: "Undo", onClick: () => restoreItem(it, i) });
                  }}
                >
                  Remove<span className="sr-only"> {s.name}, item {i + 1}</span>
                </button>
              </div>
            </div>
            <div className="col-start-2 flex items-center justify-between gap-4 sm:col-start-3 sm:flex-col sm:items-end sm:justify-start">
              <QtyStepper size="sm" label={`Quantity of ${s.name}`} value={it.config.qty} onChange={(v) => !disabled && setItemQty(it.id, v)} />
              <p className="tabular text-right">
                <span className="block text-lg">{inr(est.unit * it.config.qty)}</span>
                <span className="block text-xs text-muted">{inr(est.unit)} each</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
