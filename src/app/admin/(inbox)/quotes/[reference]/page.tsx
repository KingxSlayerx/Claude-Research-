import type { Metadata } from "next";
import { QuoteDetailRoute } from "@/components/admin/quote-detail-route";

export const metadata: Metadata = { title: "Request" };

// Rendered only after the client-side session check, so there is no static shell to validate.
export const instant = false;

export default function AdminQuotePage() {
  return <QuoteDetailRoute />;
}
