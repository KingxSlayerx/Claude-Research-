import Image from "next/image";
import Link from "next/link";
import { getStyle, ROOMS, type StyleId } from "@/domain/catalog";
import { startingPrice } from "@/domain/pricing";
import { inr } from "@/domain/format";
import { DOOR_IMAGES } from "@/content/assets";
import { Container, SectionHeading } from "@/components/ui/layout";
import { ArrowIcon, LinkButton } from "@/components/ui/button";

const FEATURED: StyleId[] = ["pivot", "panel4", "glass"];

export function Featured() {
  return (
    <section aria-labelledby="featured-title" className="bg-paper py-24 lg:py-36">
      <Container>
        <SectionHeading
          id="featured-title"
          eyebrow="Featured designs"
          title="Made to be lived with."
          intro="Three designs that show the range of the collection. Every one is made to your opening, in the material and finish you choose."
        />
        <div className="mt-16 flex flex-col gap-20 lg:mt-24 lg:gap-32">
          {FEATURED.map((id, i) => {
            const s = getStyle(id);
            const img = DOOR_IMAGES[id];
            const rooms = s.rooms.map((r) => ROOMS.find((x) => x.id === r)!.label).join(" · ");
            return (
              <article
                key={id}
                className={`reveal grid items-center gap-10 lg:grid-cols-12 lg:gap-16 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <Link href={`/doors/${s.slug}`} className="group block overflow-hidden bg-stone lg:col-span-7" tabIndex={-1} aria-hidden="true">
                  <Image
                    src={img.src}
                    alt=""
                    width={img.width}
                    height={img.height}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.03] lg:aspect-[5/5]"
                  />
                </Link>
                <div className="flex flex-col gap-6 lg:col-span-5">
                  <p className="eyebrow">{rooms}</p>
                  <h3 className="font-display text-display-m">
                    <Link href={`/doors/${s.slug}`} className="hover:text-olive">
                      {s.name}
                    </Link>
                  </h3>
                  <p className="max-w-[46ch] text-lg leading-relaxed text-ink-soft">{s.story}</p>
                  <p className="tabular text-ink-soft">
                    From <span className="text-xl text-ink">{inr(startingPrice(s))}</span>
                    <span className="ml-2 text-sm text-muted">estimate per door, before GST</span>
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <LinkButton href={`/design?style=${s.id}`}>
                      Configure {s.name} <ArrowIcon />
                    </LinkButton>
                    <LinkButton href={`/doors/${s.slug}`} variant="ghost">
                      Details
                    </LinkButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
