import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { BUSINESS } from "@/config/business";
import "./globals.css";

const inter = localFont({
  src: [{ path: "../fonts/inter-latin-opsz-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: BUSINESS.siteUrl ? new URL(BUSINESS.siteUrl) : undefined,
  title: {
    default: "Threshold — Architectural doors, made in Hyderabad",
    template: "%s · Threshold",
  },
  description:
    "Thoughtfully crafted entrance and interior doors, made to order in Hyderabad. Explore the collection, design your door and request a site measurement.",
  applicationName: "Threshold",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Threshold",
    images: [{ url: "/images/renders/hero-closed.jpg", width: 2400, height: 1350 }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body className="flex min-h-svh flex-col">{children}</body>
    </html>
  );
}
