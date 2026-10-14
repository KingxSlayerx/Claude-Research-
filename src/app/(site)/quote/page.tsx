import type { Metadata } from "next";
import { QuotePage } from "@/components/quote/quote-page";

export const metadata: Metadata = {
  title: "Your quote",
  description: "Review your doors, see an itemised estimate with GST and request a site measurement.",
  robots: { index: false },
};

export default function Page() {
  return <QuotePage />;
}
