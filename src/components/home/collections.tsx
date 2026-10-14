import Image from "next/image";
import Link from "next/link";
import { COLLECTIONS, STYLES, type CollectionId, type StyleId } from "@/domain/catalog";
import { startingPrice } from "@/domain/pricing";
import { inr } from "@/domain/format";
import { PRODUCT_RENDERS } from "@/content/assets";

/** Which design represents each collection in the bento grid. */
const HERO_STYLE: Record<CollectionId, StyleId> = {
  entrance: "main",
  panelled: "panel4",
  contemporary: "grooved",
  "light-air": "glass",
  "space-saving": "barn",
};

export function Collections() {
  const fromFor = (id: CollectionId) => Math.min(...STYLES.filter((s) => s.collections.includes(id)).map(startingPrice));
  return (
    <section id="collections" aria-labelledby="collections-title" className="scroll-mt-12 bg-paper py-24 lg:py-32">
      <div className="mx-auto max-w-[1100px] px-6 text-center">
        <p className="eyebrow-accent">Collections</p>
        <h2 id="collections-title" className="font-display mt-2 text-display-l">
          Five ways into a room.
        </h2>
        <p className="mx-auto mt-4 max-w-[48ch] text-lede text-muted">Nine designs, from substantial entrances to doors that simply slide out of the way.</p>
      </div>

      <ul className="mx-auto mt-14 grid max-w-[1240px] gap-4 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-6">
        {COLLECTIONS.map((c, i) => {
          const img = PRODUCT_RENDERS[HERO_STYLE[c.id]];
          const count = STYLES.filter((s) => s.collections.includes(c.id)).length;
          const span = i < 2 ? "lg:col-span-3" : "lg:col-span-2";
          const dark = i === 0;
          return (
            <li key={c.id} className={`reveal ${span}`}>
              <article className={`tile group relative flex h-full flex-col ${dark ? "on-dark !bg-night text-white" : ""}`}>
                <div className="relative z-10 flex flex-col items-center px-6 pt-10 text-center">
                  <p className={`eyebrow ${dark ? "!text-white/60" : ""}`}>{count === 1 ? "1 design" : `${count} designs`}</p>
                  <h3 className="font-display mt-1 text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight">{c.label}</h3>
                  <p className={`mt-2 max-w-[30ch] text-[0.95rem] ${dark ? "text-white/70" : "text-muted"}`}>{c.description}</p>
                  <p className={`tabular mt-2 text-sm ${dark ? "text-white/60" : "text-muted"}`}>From {inr(fromFor(c.id))}</p>
                  <div className="mt-4 flex gap-6 text-[0.95rem]">
                    <Link href={`/doors?collection=${c.id}`} className="chevron-link">
                      Explore<span className="sr-only"> {c.label}</span>
                    </Link>
                  </div>
                </div>
                <div className={`relative mt-6 overflow-hidden ${i < 2 ? "aspect-[5/4]" : "aspect-[4/5]"}`}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1024px) 50vw, (min-width: 768px) 50vw, 100vw"
                    className={`object-cover object-[50%_30%] transition-transform duration-[1400ms] ease-[var(--ease-apple)] group-hover:scale-[1.03] ${dark ? "opacity-95" : ""}`}
                  />
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
