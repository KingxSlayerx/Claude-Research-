/**
 * Quote request contract shared by the browser form and the server API.
 * The server re-validates everything and recomputes all prices — client
 * totals are never trusted.
 */
import { z } from "zod";
import { PROJECT_TYPES, TIMELINES, type QuoteStatus } from "./catalog";
import { normalizeConfig, type DoorConfig } from "./config";
import type { PriceLine, QuoteTotals } from "./pricing";

export const MAX_QUOTE_LINES = 30;

/** Normalises an Indian mobile number to 10 digits, or null if invalid. Mirrors the original rule. */
export function normalizeIndianMobile(input: string): string | null {
  const digits = (input || "")
    .replace(/\D/g, "")
    .replace(/^91(?=\d{10}$)/, "")
    .replace(/^0(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function formatIndianMobile(tenDigits: string): string {
  return `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;
}

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);

export const customerSchema = z.object({
  name: trimmed(80).min(2, "Enter your name so the showroom knows who to ask for."),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeIndianMobile(v) !== null, "Enter a 10-digit Indian mobile number, e.g. 98765 43210."),
  email: trimmed(120)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address, or leave it blank.")
    .default(""),
  locality: trimmed(80).min(2, "Enter the locality so we can plan the site visit."),
  projectType: z.enum(PROJECT_TYPES, { message: "Choose a project type." }),
  timeline: z.enum(TIMELINES, { message: "Choose when you need the doors." }),
  siteVisit: z.boolean(),
  notes: trimmed(1000).default(""),
  /** Customer consent to be contacted about this request. */
  consent: z.literal(true, { message: "Please confirm we may contact you about this request." }),
});

export type CustomerDetails = z.infer<typeof customerSchema>;
export type CustomerField = keyof CustomerDetails;

export const submissionSchema = z.object({
  idempotencyKey: z.string().uuid(),
  customer: customerSchema,
  items: z.array(z.unknown()).min(1, "Add at least one door.").max(MAX_QUOTE_LINES),
  /** Honeypot. Real customers never see or fill this field. */
  website: z.string().max(0).optional(),
});

export type QuoteSubmission = z.infer<typeof submissionSchema>;

export function fieldErrors(error: z.ZodError): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path.filter((p) => p !== "customer").join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Converts untrusted line items into valid configs, rejecting the whole list if any is unusable. */
export function normalizeItems(items: unknown[]): DoorConfig[] | null {
  const out: DoorConfig[] = [];
  for (const it of items) {
    const c = normalizeConfig(it);
    if (!c) return null;
    out.push(c);
  }
  return out;
}

/** A stored line: the configuration plus the server-computed estimate at submission time. */
export interface StoredLine {
  config: DoorConfig;
  summary: string;
  unit: number;
  lines: PriceLine[];
}

export interface QuoteRecord {
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;
  customer: Omit<CustomerDetails, "consent"> & { phone: string };
  items: StoredLine[];
  totals: QuoteTotals;
  pricingVersion: string;
}

export interface QuoteEvent {
  id: string;
  quoteId: string;
  createdAt: string;
  actor: string;
  kind: "created" | "status" | "note";
  fromStatus?: QuoteStatus | null;
  toStatus?: QuoteStatus | null;
  note?: string | null;
}

/** Public response after a successful submission. Contains no other customers' data. */
export interface SubmissionReceipt {
  reference: string;
  createdAt: string;
  totals: QuoteTotals;
  doors: number;
  siteVisit: boolean;
  firstName: string;
  phone: string;
}

/** Plain-text summary, used for clipboard and WhatsApp hand-off. */
export function quoteAsText(opts: {
  brand: string;
  reference?: string;
  customerName?: string;
  lines: { summary: string; roomLabel: string; qty: number; unit: number }[];
  totals: QuoteTotals;
  inr: (n: number) => string;
}): string {
  const head = opts.reference ? `${opts.brand} quote request ${opts.reference}` : `${opts.brand} door estimate`;
  const who = opts.customerName ? `\n${opts.customerName}` : "";
  const body = opts.lines
    .map((l, i) => `${i + 1}. ${l.roomLabel}: ${l.summary}\n   ${l.qty} × ${opts.inr(l.unit)} = ${opts.inr(l.unit * l.qty)}`)
    .join("\n");
  return `${head}${who}\n\n${body}\n\nSubtotal ${opts.inr(opts.totals.subtotal)} · GST ${opts.inr(opts.totals.gst)} · Estimated total ${opts.inr(opts.totals.total)}\n(Estimate only. Final price after site measurement.)`;
}
