import type { Metadata } from "next";
import { Suspense } from "react";
import { STYLES } from "@/domain/catalog";
import { Container } from "@/components/ui/layout";
import { ProductCard } from "@/components/catalog/product-card";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";

export const metadata: Metadata = {
  title: "Explore doors",
  description: "Nine door designs for entrances, bedrooms, bathrooms, kitchens and balconies — each made to order in Hyderabad with live estimates.",
  alternates: { canonical: "/doors" },
};

export default function DoorsPage() {
  const cards = Object.fromEntries(STYLES.map((s, i) => [s.id, <ProductCard key={s.id} style={s} priority={i < 3} />]));
  return (
    <Container className="py-16 lg:py-24">
      <header className="mb-14 grid gap-8 lg:mb-20 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-5">The collection</p>
          <h1 className="font-display text-display-l">Every door, made for its room.</h1>
        </div>
        <p className="max-w-[48ch] text-lg leading-relaxed text-ink-soft lg:col-span-5">
          Start from one of our nine designs, then make it yours: size, timber, finish, colour, glass and hardware. Starting prices are estimates for the configuration shown.
        </p>
      </header>
      <Suspense
        fallback={
          <ul className="grid gap-x-6 gap-y-16 sm:grid-cols-2 xl:grid-cols-3">
            {STYLES.map((s) => (
              <li key={s.id}>{cards[s.id]}</li>
            ))}
          </ul>
        }
      >
        <CatalogBrowser cards={cards} />
      </Suspense>
      <p className="mt-20 max-w-[70ch] border-t border-line pt-6 text-sm text-muted">
        &ldquo;From&rdquo; prices are estimates per door, before GST, for each design&rsquo;s standard size and specification — including its standard frame and fitting where applicable. Your final price is confirmed after a site measurement.
      </p>
    </Container>
  );
}
