/**
 * Browser client for the quote API. Distinguishes failures so the UI can
 * tell the customer exactly what happened — and never reports success
 * unless the server confirmed the request was stored.
 */
import type { CustomerDetails, SubmissionReceipt } from "@/domain/quote";
import type { DoorConfig } from "@/domain/config";

export type SubmitResult =
  | { ok: true; receipt: SubmissionReceipt }
  | { ok: false; kind: "validation"; fields: Partial<Record<string, string>>; message: string }
  | { ok: false; kind: "rate-limited" | "unavailable" | "server" | "network" | "timeout"; message: string };

export async function submitQuote(payload: {
  idempotencyKey: string;
  customer: CustomerDetails;
  items: DoorConfig[];
  website: string;
}): Promise<SubmitResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let res: Response;
  try {
    res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === "AbortError")
      return { ok: false, kind: "timeout", message: "The showroom didn't respond in time. Your quote is still here — please try again." };
    return { ok: false, kind: "network", message: "We couldn't reach the showroom. Check your connection and try again." };
  }
  clearTimeout(timer);

  let body: Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON error page */
  }
  if (res.ok && body.receipt) return { ok: true, receipt: body.receipt as SubmissionReceipt };
  if (res.status === 422)
    return {
      ok: false,
      kind: "validation",
      fields: (body.fields as Record<string, string>) ?? {},
      message: (body.error as string) ?? "Please check the highlighted details.",
    };
  if (res.status === 429)
    return { ok: false, kind: "rate-limited", message: "Too many requests from this connection. Please wait a minute and try again." };
  if (res.status === 503)
    return { ok: false, kind: "unavailable", message: "Online quote requests are temporarily unavailable. Your quote has not been sent." };
  return { ok: false, kind: "server", message: "Something went wrong on our side and your request was not saved. Please try again." };
}
