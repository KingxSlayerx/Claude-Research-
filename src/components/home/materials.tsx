import Image from "next/image";
import { CORES, FINISHES } from "@/domain/catalog";
import { MACRO_RENDERS } from "@/content/assets";
import { ChevronLink } from "@/components/ui/button";

const ITEMS = [
  {
    key: "hardware",
    image: MACRO_RENDERS.hardware,
    title: "Hardware you'll reach for every day.",
    text: "Levers, knobs, long pull bars and recessed pulls in satin steel, matte black, antique brass or rose gold — with locks from privacy latches to smart locks.",
  },
  {
    key: "panel",
    image: MACRO_RENDERS.panel,
    title: "Panels with real depth.",
    text: "Raised and recessed panels are built into the door, not printed on it, so light catches every bevel.",
  },
  {
    key: "grain",
    image: MACRO_RENDERS.grain,
    title: "Timber, chosen for the room.",
    text: `${CORES.map((c) => c.label.replace(/,.*$/, "")).join(", ")}. Finished in ${FINISHES.map((f) => f.label.toLowerCase()).join(", ")}.`,
  },
  {
    key: "louvre",
    image: MACRO_RENDERS.louvre,
    title: "Made for how rooms breathe.",
    text: "Louvres and glass lights bring air and daylight through bathrooms, stores and passages. Waterproof WPC cores where moisture is a concern.",
  },
];

export function Materials() {
  return (
    <section id="craft" aria-labelledby="craft-title" className="on-dark scroll-mt-12 bg-night py-24 text-white lg:py-32">
      <div className="mx-auto max-w-[1100px] px-6">
        <p className="eyebrow-accent !text-brass-light">Materials & craft</p>
        <h2 id="craft-title" className="font-display mt-2 max-w-[18ch] text-display-l">
          Take a closer look.
        </h2>
      </div>
      <ul tabIndex={0} className="mt-12 flex snap-x snap-mandatory focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fd0b8] gap-5 overflow-x-auto scroll-px-6 px-6 pb-6 [scrollbar-width:none] lg:scroll-px-[max(1.5rem,calc((100vw-1100px)/2))] lg:px-[max(1.5rem,calc((100vw-1100px)/2))]" aria-label="Close-ups">
        {ITEMS.map((it) => (
          <li key={it.key} className="w-[82vw] max-w-[620px] shrink-0 snap-start">
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-tile)] bg-night-soft">
                <Image src={it.image.src} alt={it.image.alt} fill sizes="(min-width: 768px) 620px, 82vw" className="object-cover" />
              </div>
              <figcaption className="mt-5 max-w-[46ch]">
                <span className="block text-[1.2rem] font-semibold tracking-[-0.02em]">{it.title}</span>
                <span className="mt-1 block text-[0.98rem] leading-relaxed text-white/65">{it.text}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <div className="mx-auto mt-6 max-w-[1100px] px-6">
        <ChevronLink href="/design">See every option in the configurator</ChevronLink>
      </div>
    </section>
  );
}
