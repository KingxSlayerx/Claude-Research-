import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTIONS, ROOMS, STYLES, findStyleBySlug } from "@/domain/catalog";
import { defaultConfig } from "@/domain/config";
import { CATEGORY_LABELS, priceDoor, startingPrice, type LineCategory } from "@/domain/pricing";
import { specRows } from "@/domain/summary";
import { inr } from "@/domain/format";
import { DOOR_IMAGES } from "@/content/assets";
import { Container } from "@/components/ui/layout";
import { ArrowIcon, LinkButton } from "@/components/ui/button";
import { ProductCard } from "@/components/catalog/product-card";

export function generateStaticParams() {
  return STYLES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = findStyleBySlug(slug);
  if (!s) return {};
  return {
    title: `${s.name} door`,
    description: `${s.blurb} From ${inr(startingPrice(s))} per door (estimate, before GST). Made to order in Hyderabad.`,
    alternates: { canonical: `/doors/${s.slug}` },
    openGraph: { images: [{ url: DOOR_IMAGES[s.id].src }] },
  };
}

export default async function DoorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = findStyleBySlug(slug);
  if (!s) notFound();
  const cfg = defaultConfig(s.id);
  const est = priceDoor(cfg);
  const img = DOOR_IMAGES[s.id];
  const rooms = s.rooms.map((r) => ROOMS.find((x) => x.id === r)!.label);
  const cols = s.collections.map((c) => COLLECTIONS.find((x) => x.id === c)!);
  const grouped = (Object.keys(CATEGORY_LABELS) as LineCategory[])
    .map((cat) => ({ cat, lines: est.lines.filter((l) => l.category === cat) }))
    .filter((g) => g.lines.length);
  const others = STYLES.filter((x) => x.id !== s.id && x.rooms.some((r) => s.rooms.includes(r))).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${s.name} door`,
    description: s.story,
    brand: { "@type": "Brand", name: "Threshold" },
    offers: { "@type": "Offer", priceCurrency: "INR", price: est.unit, availability: "https://schema.org/MadeToOrder" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container className="py-10 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <ol className="flex gap-2">
            <li>
              <Link href="/doors" className="hover:text-ink">
                Doors
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {s.name}
            </li>
          </ol>
        </nav>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/5] overflow-hidden bg-stone lg:sticky lg:top-28">
              <Image src={img.src} alt={img.alt} fill preload sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            </div>
          </div>
          <div className="flex flex-col gap-8 lg:col-span-5">
            <div className="flex flex-col gap-5">
              <p className="eyebrow">{rooms.join(" · ")}</p>
              <h1 className="font-display text-display-l">{s.name}</h1>
              <p className="text-lg leading-relaxed text-ink-soft">{s.story}</p>
            </div>
            <div className="flex flex-col gap-1 border-y border-line py-6">
              <p className="tabular text-ink-soft">
                From <span className="font-display text-[2.4rem] leading-none text-ink">{inr(est.unit)}</span>
              </p>
              <p className="text-sm text-muted">Estimate per door, before GST, for the specification below. Confirmed after site measurement.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href={`/design?style=${s.id}`} size="lg">
                Configure this door <ArrowIcon />
              </LinkButton>
              <LinkButton href={`/visualise?style=${s.id}`} variant="secondary" size="lg">
                See it in your space
              </LinkButton>
            </div>

            <section aria-labelledby="spec-title" className="flex flex-col gap-4 pt-4">
              <h2 id="spec-title" className="eyebrow">
                Standard specification
              </h2>
              <dl className="grid grid-cols-[8rem_1fr] border-t border-line text-[0.95rem]">
                {specRows(cfg).map((r) => (
                  <div key={r.label} className="col-span-2 grid grid-cols-subgrid border-b border-line py-2.5">
                    <dt className="text-muted">{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="inc-title" className="flex flex-col gap-4">
              <h2 id="inc-title" className="eyebrow">
                What the starting price includes
              </h2>
              <div className="flex flex-col gap-4">
                {grouped.map((g) => (
                  <div key={g.cat}>
                    <h3 className="mb-1 text-sm font-semibold">{CATEGORY_LABELS[g.cat]}</h3>
                    <ul className="text-[0.95rem]">
                      {g.lines.map((l) => (
                        <li key={l.key} className="flex justify-between gap-6 border-b border-line py-2 text-ink-soft">
                          <span>{l.label}</span>
                          <span className="tabular shrink-0 text-ink">{l.amount ? inr(l.amount) : "Included"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {cols.length > 0 && (
              <p className="text-sm text-muted">
                Part of{" "}
                {cols.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && " and "}
                    <Link className="link-underline text-ink" href={`/doors?collection=${c.id}`}>
                      {c.label}
                    </Link>
                  </span>
                ))}
                .
              </p>
            )}
          </div>
        </div>
      </Container>
      {others.length > 0 && (
        <section aria-labelledby="others-title" className="border-t border-line bg-paper py-20 lg:py-28">
          <Container>
            <h2 id="others-title" className="font-display mb-12 text-display-m">
              For the same rooms
            </h2>
            <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <li key={o.id}>
                  <ProductCard style={o} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
