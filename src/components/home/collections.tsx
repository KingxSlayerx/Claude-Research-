import Image from "next/image";
import Link from "next/link";
import { COLLECTIONS, STYLES } from "@/domain/catalog";
import { COLLECTION_IMAGES } from "@/content/assets";
import { Container, SectionHeading } from "@/components/ui/layout";
import { ArrowIcon } from "@/components/ui/button";

export function Collections() {
  return (
    <section id="collections" aria-labelledby="collections-title" className="scroll-mt-20 py-24 lg:py-36">
      <Container>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            id="collections-title"
            eyebrow="Collections"
            title="Five ways into a room."
            intro="Nine designs, grouped by the character they bring — from substantial entrances to doors that simply slide out of the way."
          />
          <Link href="/doors" className="link-underline shrink-0 self-start pb-1 text-[0.95rem] lg:self-end">
            View all nine designs
          </Link>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-6 lg:gap-5">
          {COLLECTIONS.map((c, i) => {
            const count = STYLES.filter((s) => s.collections.includes(c.id)).length;
            const img = COLLECTION_IMAGES[c.id];
            const layout = i < 2 ? "lg:col-span-3 lg:aspect-[5/4]" : "lg:col-span-2 lg:aspect-[4/5]";
            return (
              <li key={c.id} className={`reveal ${i === 0 ? "sm:col-span-2" : ""} ${layout}`}>
                <Link
                  href={`/doors?collection=${c.id}`}
                  className="group relative flex aspect-[4/5] h-full w-full overflow-hidden bg-stone sm:aspect-auto sm:min-h-[420px] lg:min-h-0"
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.035]"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(20,15,10,.62)_100%)]" />
                  <span className="relative mt-auto flex w-full items-end justify-between gap-4 p-6 text-paper lg:p-8">
                    <span>
                      <span className="eyebrow block !text-paper/75">{count} {count === 1 ? "design" : "designs"}</span>
                      <span className="font-display mt-2 block text-[2.2rem] leading-none lg:text-[2.6rem]">{c.label}</span>
                      <span className="mt-3 block max-w-[34ch] text-[0.95rem] text-paper/85">{c.description}</span>
                    </span>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-paper/60 transition-colors group-hover:bg-paper group-hover:text-ink">
                      <ArrowIcon />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
