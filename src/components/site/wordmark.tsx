export function Wordmark({ tone = "ink", compact = false }: { tone?: "ink" | "paper"; compact?: boolean }) {
  const color = tone === "ink" ? "text-ink" : "text-white";
  return (
    <span className={`flex items-center gap-2 ${color}`}>
      <svg aria-hidden="true" viewBox="0 0 20 28" className={compact ? "h-[18px] w-[13px]" : "h-6 w-[17px]"}>
        <rect x="1" y="1" width="18" height="26" rx="1" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="14" cy="15" r="1.6" fill="var(--color-brass-metal)" />
      </svg>
      <span className={`font-semibold tracking-[-0.03em] ${compact ? "text-[1.05rem]" : "text-[1.35rem]"}`}>Threshold</span>
    </span>
  );
}
