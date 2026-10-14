import { CATEGORY_LABELS, type DoorEstimate, type LineCategory } from "@/domain/pricing";
import { inr } from "@/domain/format";

/** Itemised estimate for one door, grouped into product, hardware, frame and installation. */
export function PriceBreakdown({ estimate, compact = false }: { estimate: DoorEstimate; compact?: boolean }) {
  const groups = (Object.keys(CATEGORY_LABELS) as LineCategory[])
    .map((cat) => ({ cat, lines: estimate.lines.filter((l) => l.category === cat) }))
    .filter((g) => g.lines.length);
  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-5"}`}>
      {groups.map((g) => {
        const sum = g.lines.reduce((a, l) => a + l.amount, 0);
        return (
          <div key={g.cat}>
            <div className="flex items-baseline justify-between border-b border-line pb-1.5 text-sm font-semibold">
              <span>{CATEGORY_LABELS[g.cat]}</span>
              <span className="tabular">{inr(sum)}</span>
            </div>
            <ul className="text-[0.85rem] text-ink-soft">
              {g.lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-6 py-1.5">
                  <span>{l.label}</span>
                  <span className="tabular shrink-0">{l.amount ? inr(l.amount) : "Included"}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
