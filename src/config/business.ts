/**
 * Public business details. Nothing here is invented: every value comes from
 * an environment variable and is omitted from the site until it is set.
 * See .env.example and docs/DEPLOYMENT.md.
 */

const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

/** Digits only, with country code, e.g. 919876543210. */
function waNumber(v: string | undefined): string | null {
  const d = (v ?? "").replace(/\D/g, "");
  return /^91[6-9]\d{9}$/.test(d) ? d : null;
}

export const BUSINESS = {
  name: "Threshold",
  tagline: "Doors & Interiors · Hyderabad",
  city: "Hyderabad",
  siteUrl: clean(process.env.NEXT_PUBLIC_SITE_URL),
  phone: clean(process.env.NEXT_PUBLIC_SHOWROOM_PHONE),
  email: clean(process.env.NEXT_PUBLIC_SHOWROOM_EMAIL),
  address: clean(process.env.NEXT_PUBLIC_SHOWROOM_ADDRESS),
  hours: clean(process.env.NEXT_PUBLIC_SHOWROOM_HOURS),
  whatsapp: waNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
} as const;

export function whatsappLink(text?: string): string | null {
  if (!BUSINESS.whatsapp) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${BUSINESS.whatsapp}${q}`;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
