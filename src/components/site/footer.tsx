import Link from "next/link";
import { BUSINESS, telLink, whatsappLink } from "@/config/business";
import { COLLECTIONS } from "@/domain/catalog";

export function Footer() {
  const wa = whatsappLink();
  const hasContact = BUSINESS.phone || BUSINESS.email || BUSINESS.address || wa;
  const col = "flex flex-col gap-2";
  const link = "text-ink-soft/80 hover:text-ink hover:underline underline-offset-2";
  return (
    <footer className="mt-auto bg-stone text-[0.78rem] leading-relaxed text-muted">
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <p className="border-b border-line pb-4">
          All prices on this site are estimates per door, before GST unless stated. Final prices are confirmed after a site measurement. Product images are 3D renders of each design&rsquo;s standard specification.
        </p>
        <div className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-label="Doors" className={col}>
            <h2 className="font-semibold text-ink">Doors</h2>
            <Link className={link} href="/doors">
              All designs
            </Link>
            {COLLECTIONS.map((c) => (
              <Link key={c.id} className={link} href={`/doors?collection=${c.id}`}>
                {c.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Plan" className={col}>
            <h2 className="font-semibold text-ink">Plan your project</h2>
            <Link className={link} href="/design">
              Design your door
            </Link>
            <Link className={link} href="/visualise">
              See it at home
            </Link>
            <Link className={link} href="/quote">
              Your quote
            </Link>
            <Link className={link} href="/#approach">
              Measurement & fitting
            </Link>
          </nav>
          <div className={col}>
            <h2 className="font-semibold text-ink">Visit & contact</h2>
            {hasContact ? (
              <address className="flex flex-col gap-2 not-italic">
                {BUSINESS.address && <span className="whitespace-pre-line">{BUSINESS.address}</span>}
                {BUSINESS.hours && <span>{BUSINESS.hours}</span>}
                {BUSINESS.phone && (
                  <a className={link} href={telLink(BUSINESS.phone)}>
                    {BUSINESS.phone}
                  </a>
                )}
                {BUSINESS.email && (
                  <a className={link} href={`mailto:${BUSINESS.email}`}>
                    {BUSINESS.email}
                  </a>
                )}
                {wa && (
                  <a className={link} href={wa} target="_blank" rel="noopener noreferrer">
                    WhatsApp the showroom
                  </a>
                )}
              </address>
            ) : (
              <p>Based in {BUSINESS.city}. Send a quote request and the showroom will call you back to arrange a site measurement.</p>
            )}
          </div>
          <div className={col}>
            <h2 className="font-semibold text-ink">Threshold</h2>
            <p>Doors and interiors, made to order in Hyderabad.</p>
          </div>
        </div>
        <p className="border-t border-line pt-4">© Threshold Doors & Interiors, Hyderabad</p>
      </div>
    </footer>
  );
}
