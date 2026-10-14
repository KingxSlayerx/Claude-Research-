import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Showroom", template: "%s · Threshold showroom" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
