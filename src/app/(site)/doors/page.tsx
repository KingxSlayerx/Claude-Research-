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
      <header className="mb-12 text-center lg:mb-16">
        <p className="eyebrow-accent">The collection</p>
        <h1 className="font-display mt-2 text-display-l">Every door, made for its room.</h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-lede text-muted">Start from one of nine designs, then make it yours: size, timber, finish, colour, glass and hardware.</p>
      </header>
      <Suspense
        fallback={
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {STYLES.map((s) => (
              <li key={s.id}>{cards[s.id]}</li>
            ))}
          </ul>
        }
      >
        <CatalogBrowser cards={cards} />
      </Suspense>
      <p className="mx-auto mt-16 max-w-[70ch] text-center text-sm text-muted">
        &ldquo;From&rdquo; prices are estimates per door, before GST, for each design&rsquo;s standard size and specification — including its standard frame and fitting where applicable. Your final price is confirmed after a site measurement.
      </p>
    </Container>
  );
}
