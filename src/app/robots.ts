import type { MetadataRoute } from "next";
import { BUSINESS } from "@/config/business";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/quote"] }],
    sitemap: BUSINESS.siteUrl ? `${BUSINESS.siteUrl.replace(/\/$/, "")}/sitemap.xml` : undefined,
  };
}
