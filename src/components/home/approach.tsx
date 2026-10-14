import Image from "next/image";
import { PROCESS_IMAGE } from "@/content/assets";
import { Container } from "@/components/ui/layout";

const STEPS = [
  {
    title: "Design and estimate",
    text: "Choose a design, size and materials online and see an itemised estimate as you go. Add every door for the project to one quote.",
  },
  {
    title: "Site measurement",
    text: "We call you back to arrange a free site measurement. Our team checks each opening, the wall and any existing frames before anything is made.",
  },
  {
    title: "Confirmed quote",
    text: "You receive a final quote based on the measured openings. Prices online are estimates; this is the price you approve.",
  },
  {
    title: "Made and fitted",
    text: "Your doors are made to the measured sizes and fitted by our own installation team, with the hardware you chose.",
  },
];

export function Approach() {
  return (
    <section id="approach" aria-labelledby="approach-title" className="scroll-mt-20 border-y border-line bg-paper py-24 lg:py-36">
      <Container className="grid gap-16 lg:grid-cols-12 lg:gap-20">
        <div className="flex flex-col gap-8 lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <p className="eyebrow">Our approach</p>
          <h2 id="approach-title" className="font-display text-display-l">
            Measured once, properly.
          </h2>
          <p className="max-w-[44ch] text-lg leading-relaxed text-ink-soft">
            A door is only as good as its fit. Nothing goes into production until we have measured your openings ourselves.
          </p>
          <div className="overflow-hidden bg-stone">
            <Image src={PROCESS_IMAGE.src} alt={PROCESS_IMAGE.alt} width={PROCESS_IMAGE.width} height={PROCESS_IMAGE.height} sizes="(min-width: 1024px) 38vw, 100vw" className="aspect-[3/2] w-full object-cover" />
          </div>
        </div>
        <ol className="flex flex-col lg:col-span-6 lg:col-start-7">
          {STEPS.map((s, i) => (
            <li key={s.title} className="reveal grid grid-cols-[3.5rem_1fr] gap-x-4 border-t border-line py-10 first:border-t-0 first:pt-0 lg:py-14">
              <span className="font-display text-[2.5rem] leading-none text-brass" aria-hidden="true">
                {i + 1}
              </span>
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-display-s">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="max-w-[46ch] text-ink-soft">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
