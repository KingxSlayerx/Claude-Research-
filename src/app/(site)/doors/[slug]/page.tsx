import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTIONS, ROOMS, STYLES, findStyleBySlug } from "@/domain/catalog";
import { defaultConfig } from "@/domain/config";
import { CATEGORY_LABELS, priceDoor, startingPrice, type LineCategory } from "@/domain/pricing";
import { specRows } from "@/domain/summary";
import { inr } from "@/domain/format";
import { PRODUCT_RENDERS } from "@/content/assets";
import { LinkButton, ChevronLink } from "@/components/ui/button";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductViewer } from "@/components/catalog/product-viewer";

// Every valid slug is prerendered by generateStaticParams; unknown slugs are answered with a 404 in src/proxy.ts.
export const instant = false;

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
    openGraph: { images: [{ url: PRODUCT_RENDERS[s.id].src }] },
  };
}

export default async function DoorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = findStyleBySlug(slug);
  if (!s) notFound();
  const cfg = defaultConfig(s.id);
  const est = priceDoor(cfg);
  const img = PRODUCT_RENDERS[s.id];
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

      {/* Local navigation */}
      <div className="sticky top-12 z-30 border-b border-black/[0.06] bg-[rgba(251,250,248,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex h-13 max-w-[1100px] items-center justify-between gap-4 px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[1.2rem] font-semibold tracking-[-0.02em]">
            <Link href="/doors" className="text-muted hover:text-ink">
              <span className="sr-only">All doors / </span>
              <span aria-hidden="true" className="text-base font-normal">
                ‹
              </span>
            </Link>
            <span aria-current="page">{s.name}</span>
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <span className="tabular text-muted max-sm:hidden">From {inr(est.unit)}</span>
            <Link href={`/design?style=${s.id}`} className="inline-flex h-7 items-center rounded-full bg-olive px-3.5 text-[0.78rem] font-medium text-white hover:bg-olive-deep">
              Configure
            </Link>
          </div>
        </div>
      </div>

      <section className="pt-14 text-center lg:pt-20">
        <div className="mx-auto max-w-[900px] px-6">
          <p className="eyebrow-accent">{rooms.join(" · ")}</p>
          <h1 className="font-display mt-2 text-display-xl">{s.name}</h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-lede text-muted">{s.blurb}</p>
          <p className="tabular mt-5 text-[1.05rem]">
            From {inr(est.unit)} <span className="text-muted">per door, before GST</span>
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
            <LinkButton href={`/design?style=${s.id}`} size="lg">
              Configure this door
            </LinkButton>
            <ChevronLink href={`/visualise?style=${s.id}`}>See it at home</ChevronLink>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-[1240px] px-4 sm:px-6">
          <div className="tile relative aspect-[4/5] sm:aspect-[16/10]">
            <Image src={img.src} alt={img.alt} fill preload sizes="(min-width: 1240px) 1240px, 100vw" className="object-cover object-[50%_35%]" />
          </div>
        </div>
      </section>

      <section aria-labelledby="story-title" className="py-20 lg:py-28">
        <div className="mx-auto max-w-[820px] px-6 text-center">
          <h2 id="story-title" className="sr-only">
            About the {s.name}
          </h2>
          <p className="font-display text-[clamp(1.5rem,2.6vw,2.2rem)] leading-snug tracking-[-0.02em]">{s.story}</p>
        </div>
      </section>

      <section aria-labelledby="viewer-title" className="on-dark bg-night py-20 text-white lg:py-28">
        <div className="mx-auto max-w-[1100px] px-6 text-center">
          <h2 id="viewer-title" className="font-display text-display-m">
            Turn it around.
          </h2>
          <p className="mx-auto mt-3 max-w-[44ch] text-lede text-white/70">Drag to look at the {s.name} from any angle, then open it.</p>
        </div>
        <div className="mx-auto mt-10 max-w-[1240px] px-4 sm:px-6">
          <ProductViewer styleId={s.id} poster={img.src} />
        </div>
      </section>

      <section aria-labelledby="spec-title" className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1100px] gap-14 px-6 lg:grid-cols-2">
          <div>
            <h2 id="spec-title" className="font-display text-display-s">
              Standard specification
            </h2>
            <dl className="mt-6 grid grid-cols-[8rem_1fr] border-t border-line text-[0.98rem]">
              {specRows(cfg).map((r) => (
                <div key={r.label} className="col-span-2 grid grid-cols-subgrid border-b border-line py-3">
                  <dt className="text-muted">{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="font-display text-display-s">What the starting price includes</h2>
            <div className="mt-6 flex flex-col gap-6">
              {grouped.map((g) => (
                <div key={g.cat}>
                  <h3 className="text-sm font-semibold">{CATEGORY_LABELS[g.cat]}</h3>
                  <ul className="mt-1 text-[0.95rem]">
                    {g.lines.map((l) => (
                      <li key={l.key} className="flex justify-between gap-6 border-b border-line py-2.5 text-muted">
                        <span>{l.label}</span>
                        <span className="tabular shrink-0 text-ink">{l.amount ? inr(l.amount) : "Included"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-sm text-muted">Every option can be changed in the configurator, with the estimate updating as you go. Confirmed after a site measurement.</p>
            </div>
            {cols.length > 0 && (
              <p className="mt-6 text-sm text-muted">
                Part of{" "}
                {cols.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && " and "}
                    <Link className="text-olive hover:underline" href={`/doors?collection=${c.id}`}>
                      {c.label}
                    </Link>
                  </span>
                ))}
                .
              </p>
            )}
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="others-title" className="bg-paper py-20 lg:py-28">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <h2 id="others-title" className="font-display mb-10 text-center text-display-m">
              For the same rooms.
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <li key={o.id}>
                  <ProductCard style={o} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
