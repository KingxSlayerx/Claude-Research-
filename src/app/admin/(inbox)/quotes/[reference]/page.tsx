"use client";

import { useParams } from "next/navigation";
import { QuoteDetail } from "@/components/admin/quote-detail";

export default function AdminQuotePage() {
  const { reference } = useParams<{ reference: string }>();
  return <QuoteDetail key={reference} reference={reference} />;
}
