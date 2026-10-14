import Image from "next/image";
import { CORES, FINISHES, HARDWARE_FINISHES, HANDLES } from "@/domain/catalog";
import { MATERIAL_IMAGES } from "@/content/assets";
import { Container, SectionHeading } from "@/components/ui/layout";

const paint = FINISHES.find((f) => f.id === "pu")!;

const STORIES = [
  {
    key: "wood",
    image: MATERIAL_IMAGES.wood,
    title: "Wood",
    text: "Every door starts with its core. Choose from engineered and flush boards for stability, waterproof WPC for wet rooms, or solid sal and Burma teak for doors meant to last generations.",
    list: CORES.map((c) => c.label),
  },
  {
    key: "finishes",
    image: MATERIAL_IMAGES.finishes,
    title: "Finishes",
    text: "Natural veneer for the warmth of real timber, hard-wearing laminate, seamless membrane, or a smooth satin paint.",
    list: FINISHES.map((f) => `${f.label} — ${f.note}`),
  },
  {
    key: "colours",
    image: MATERIAL_IMAGES.colours,
    title: "Colour",
    text: "Considered shades that sit quietly with stone, plaster and timber. Painted doors come in chalk, sage, clay, ink blue and black.",
    swatches: paint.colors,
  },
  {
    key: "hardware",
    image: MATERIAL_IMAGES.hardware,
    title: "Hardware",
    text: "Levers, knobs, long pull bars and recessed pulls, with locks from simple privacy latches to mortise and smart locks.",
    swatches: HARDWARE_FINISHES.map((h) => ({ id: h.id, label: h.label, hex: h.hex })),
    list: HANDLES.map((h) => h.label),
  },
] as const;

export function Materials() {
  return (
    <section id="materials" aria-labelledby="materials-title" className="scroll-mt-20 py-24 lg:py-36">
      <Container>
        <SectionHeading
          id="materials-title"
          eyebrow="Materials"
          title="What a door is made of matters."
          intro="Timber, surface, colour and the hardware your hand meets every day. Each choice is shown, priced and explained as you design."
        />
        <div className="mt-16 grid gap-x-8 gap-y-16 md:grid-cols-2 lg:mt-24 lg:gap-x-12 lg:gap-y-24">
          {STORIES.map((s, i) => (
            <article key={s.key} className={`reveal flex flex-col gap-6 ${i % 2 ? "md:mt-24" : ""}`}>
              <div className="overflow-hidden bg-stone">
                <Image src={s.image.src} alt={s.image.alt} width={s.image.width} height={s.image.height} sizes="(min-width: 768px) 45vw, 100vw" className="aspect-[3/2] w-full object-cover" />
              </div>
              <div className="flex items-baseline gap-4">
                <span className="tabular text-sm text-brass">0{i + 1}</span>
                <h3 className="font-display text-display-s">{s.title}</h3>
              </div>
              <p className="max-w-[48ch] text-ink-soft">{s.text}</p>
              {"swatches" in s && s.swatches && (
                <ul className="flex flex-wrap gap-4" aria-label={`${s.title} options`}>
                  {s.swatches.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 text-sm text-ink-soft">
                      <span aria-hidden="true" className="h-5 w-5 rounded-full border border-black/15" style={{ background: c.hex }} />
                      {c.label}
                    </li>
                  ))}
                </ul>
              )}
              {"list" in s && s.list && (
                <ul className="flex flex-col border-t border-line text-[0.95rem]">
                  {s.list.map((item) => (
                    <li key={item} className="border-b border-line py-2.5 text-ink-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
