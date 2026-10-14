import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { BUSINESS } from "@/config/business";
import "./globals.css";

const instrument = localFont({
  src: [
    { path: "../fonts/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

const hanken = localFont({
  src: [
    { path: "../fonts/hanken-grotesk-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/hanken-grotesk-latin-wght-italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-hanken",
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
    images: [{ url: "/images/placeholders/hero-entrance.jpg", width: 2400, height: 1500 }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f4efe6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${instrument.variable} ${hanken.variable}`}>
      <body className="flex min-h-svh flex-col">{children}</body>
    </html>
  );
}
