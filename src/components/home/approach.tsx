const STEPS = [
  { title: "Design and estimate", text: "Choose a design, size and materials online and see an itemised estimate as you go. Add every door for the project to one quote." },
  { title: "Site measurement", text: "We call you back to arrange a free site measurement, and check each opening, the wall and any existing frames." },
  { title: "Confirmed quote", text: "You receive a final quote for the measured openings. Prices online are estimates; this is the price you approve." },
  { title: "Made and fitted", text: "Your doors are made to the measured sizes and fitted by our own team, with the hardware you chose." },
];

export function Approach() {
  return (
    <section id="approach" aria-labelledby="approach-title" className="scroll-mt-12 bg-ivory py-24 lg:py-32">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="text-center">
          <p className="eyebrow-accent">Our approach</p>
          <h2 id="approach-title" className="font-display mt-2 text-display-l">
            Measured once, properly.
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-lede text-muted">A door is only as good as its fit. Nothing is made until we have measured your openings ourselves.</p>
        </div>
        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="reveal tile flex flex-col gap-3 !bg-paper p-7">
              <span className="tabular text-sm font-semibold text-brass" aria-hidden="true">
                0{i + 1}
              </span>
              <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em]">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="text-[0.98rem] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
