import { CORES, FINISHES, HARDWARE_FINISHES, LOCKS, STYLES, BUSINESS_RULES } from "@/domain/catalog";

/** Facts drawn from the catalogue itself, so every number is true. */
export function Featured() {
  const colours = FINISHES.reduce((a, f) => a + f.colors.length, 0);
  const stats = [
    { value: String(STYLES.length), label: "door designs, from flush to carved teak" },
    { value: `${BUSINESS_RULES.width.min}–${BUSINESS_RULES.width.max}`, unit: "mm", label: `widths, made to your opening in ${BUSINESS_RULES.width.step} mm steps` },
    { value: String(colours), label: `colours across ${FINISHES.length} finishes, from natural veneer to satin paint` },
    { value: String(CORES.length), label: `core materials, from waterproof WPC to solid Burma teak, with ${HARDWARE_FINISHES.length} hardware finishes and ${LOCKS.length - 1} locks` },
  ];
  return (
    <section aria-label="Threshold in numbers" className="bg-ivory py-20 lg:py-28">
      <dl className="mx-auto grid max-w-[1100px] gap-x-10 gap-y-12 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="reveal flex flex-col gap-2 border-t border-line pt-6">
            <dt className="order-2 text-[0.95rem] leading-snug text-muted">{s.label}</dt>
            <dd className="font-display tabular order-1 text-[clamp(2.4rem,4.4vw,3.6rem)] leading-none">
              {s.value}
              {s.unit && <span className="ml-1 text-[0.45em] font-medium text-muted">{s.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
