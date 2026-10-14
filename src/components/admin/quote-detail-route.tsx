"use client";

import { useParams } from "next/navigation";
import { QuoteDetail } from "./quote-detail";

export function QuoteDetailRoute() {
  const { reference } = useParams<{ reference: string }>();
  return <QuoteDetail key={reference} reference={reference} />;
}
