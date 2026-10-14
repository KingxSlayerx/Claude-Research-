import { getStatus, type QuoteStatus } from "@/domain/catalog";

const TONES: Record<QuoteStatus, string> = {
  new: "bg-olive text-paper border-olive",
  contacted: "border-brass text-brass",
  visit: "border-teak text-teak",
  quoted: "border-ink-soft text-ink-soft",
  won: "border-olive text-olive",
  lost: "border-muted text-muted",
};

export function StatusPill({ status }: { status: QuoteStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.08em] ${TONES[status]}`}>
      {getStatus(status)?.label ?? status}
    </span>
  );
}
