import type { MetadataRoute } from "next";
import { BUSINESS } from "@/config/business";
import { STYLES } from "@/domain/catalog";

/** Only generated when NEXT_PUBLIC_SITE_URL is set, so no invented domain is published. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!BUSINESS.siteUrl) return [];
  const base = BUSINESS.siteUrl.replace(/\/$/, "");
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/doors`, priority: 0.9 },
    ...STYLES.map((s) => ({ url: `${base}/doors/${s.slug}`, priority: 0.8 })),
    { url: `${base}/design`, priority: 0.7 },
    { url: `${base}/visualise`, priority: 0.6 },
  ];
}
