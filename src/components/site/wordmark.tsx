export function Wordmark({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  const color = tone === "ink" ? "text-ink" : "text-paper";
  return (
    <span className={`flex items-center gap-3 ${color}`}>
      <svg aria-hidden="true" viewBox="0 0 20 28" className="h-7 w-5">
        <rect x="1" y="1" width="18" height="26" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="4.5" y="4.5" width="11" height="22.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity=".55" />
        <circle cx="13" cy="15" r="1.2" fill="var(--color-brass)" />
      </svg>
      <span className="font-display text-[1.7rem] leading-none tracking-[-0.01em]">Threshold</span>
    </span>
  );
}
