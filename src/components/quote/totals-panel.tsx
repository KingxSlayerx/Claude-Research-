import { BUSINESS_RULES } from "@/domain/catalog";
import { CATEGORY_LABELS, type LineCategory, type QuoteTotals } from "@/domain/pricing";
import { inr, plural } from "@/domain/format";

export function TotalsPanel({ totals }: { totals: QuoteTotals }) {
  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col text-[0.95rem]">
        {(Object.keys(CATEGORY_LABELS) as LineCategory[])
          .filter((c) => totals.byCategory[c] > 0)
          .map((c) => (
            <div key={c} className="flex justify-between gap-4 py-1.5 text-ink-soft">
              <dt>{CATEGORY_LABELS[c]}</dt>
              <dd className="tabular">{inr(totals.byCategory[c])}</dd>
            </div>
          ))}
        <div className="mt-2 flex justify-between gap-4 border-t border-line pt-3">
          <dt>Subtotal, {plural(totals.doors, "door")}</dt>
          <dd className="tabular">{inr(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5 text-ink-soft">
          <dt>GST at {Math.round(BUSINESS_RULES.gstRate * 100)}%</dt>
          <dd className="tabular">{inr(totals.gst)}</dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-ink pt-3">
          <dt className="font-semibold">Estimated total</dt>
          <dd className="tabular font-display text-[2.2rem] leading-none">{inr(totals.total)}</dd>
        </div>
      </dl>
      <p className="text-xs leading-relaxed text-muted">
        This is an estimate, not a confirmed quote. The final price follows a site measurement and may change with opening sizes and wall condition.
      </p>
    </div>
  );
}
