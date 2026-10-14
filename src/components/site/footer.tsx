import Link from "next/link";
import { BUSINESS, telLink, whatsappLink } from "@/config/business";
import { COLLECTIONS } from "@/domain/catalog";
import { Container } from "@/components/ui/layout";
import { Wordmark } from "./wordmark";

export function Footer() {
  const wa = whatsappLink();
  const hasContact = BUSINESS.phone || BUSINESS.email || BUSINESS.address || wa;
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <Container className="grid gap-12 py-16 md:grid-cols-12 lg:py-20">
        <div className="flex flex-col gap-5 md:col-span-4">
          <Wordmark />
          <p className="max-w-[34ch] text-ink-soft">Doors and interiors, made to order in Hyderabad and fitted by our own team.</p>
        </div>

        <nav aria-label="Doors" className="md:col-span-2">
          <h2 className="eyebrow mb-4">Doors</h2>
          <ul className="flex flex-col gap-2.5 text-[0.95rem]">
            <li>
              <Link className="hover:text-olive" href="/doors">
                All designs
              </Link>
            </li>
            {COLLECTIONS.map((c) => (
              <li key={c.id}>
                <Link className="hover:text-olive" href={`/doors?collection=${c.id}`}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Plan" className="md:col-span-2">
          <h2 className="eyebrow mb-4">Plan</h2>
          <ul className="flex flex-col gap-2.5 text-[0.95rem]">
            <li>
              <Link className="hover:text-olive" href="/design">
                Design your door
              </Link>
            </li>
            <li>
              <Link className="hover:text-olive" href="/visualise">
                See it in your space
              </Link>
            </li>
            <li>
              <Link className="hover:text-olive" href="/quote">
                Your quote
              </Link>
            </li>
            <li>
              <Link className="hover:text-olive" href="/#approach">
                Measurement & fitting
              </Link>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="eyebrow mb-4">Visit & contact</h2>
          {hasContact ? (
            <address className="flex flex-col gap-2.5 text-[0.95rem] not-italic">
              {BUSINESS.address && <span className="whitespace-pre-line text-ink-soft">{BUSINESS.address}</span>}
              {BUSINESS.hours && <span className="text-ink-soft">{BUSINESS.hours}</span>}
              {BUSINESS.phone && (
                <a className="hover:text-olive" href={telLink(BUSINESS.phone)}>
                  {BUSINESS.phone}
                </a>
              )}
              {BUSINESS.email && (
                <a className="hover:text-olive" href={`mailto:${BUSINESS.email}`}>
                  {BUSINESS.email}
                </a>
              )}
              {wa && (
                <a className="hover:text-olive" href={wa} target="_blank" rel="noopener noreferrer">
                  WhatsApp the showroom
                </a>
              )}
            </address>
          ) : (
            <p className="text-[0.95rem] text-ink-soft">
              Based in {BUSINESS.city}. Send a quote request and the showroom will call you back to arrange a site measurement.
            </p>
          )}
        </div>
      </Container>
      <Container className="flex flex-col gap-3 border-t border-line py-6 text-sm text-muted sm:flex-row sm:justify-between">
        <p>© Threshold Doors & Interiors, Hyderabad</p>
        <p>All prices on this site are estimates. Final prices are confirmed after a site measurement.</p>
      </Container>
    </footer>
  );
}
