import type { QuoteStatus } from "@/domain/catalog";
import type { QuoteEvent, QuoteRecord } from "@/domain/quote";

export type NewQuote = Omit<QuoteRecord, "id" | "reference" | "createdAt" | "updatedAt" | "status"> & {
  idempotencyKey: string;
};

export interface QuoteListQuery {
  search?: string;
  status?: QuoteStatus | "all";
  limit?: number;
}

export interface QuoteSummary {
  reference: string;
  createdAt: string;
  updatedAt: string;
  status: QuoteStatus;
  name: string;
  phone: string;
  locality: string;
  projectType: string;
  timeline: string;
  siteVisit: boolean;
  doors: number;
  total: number;
}

export interface QuoteList {
  items: QuoteSummary[];
  counts: Record<QuoteStatus, number>;
  /** Number of requests matching the query (may exceed items.length). */
  matched: number;
}

/** Persistence boundary. Implementations: Supabase (production) and local file (development). */
export interface QuoteStore {
  readonly kind: "supabase" | "file";
  /** Stores a request. Returns the existing record if the idempotency key was seen before. */
  create(input: NewQuote, makeReference: () => string): Promise<{ record: QuoteRecord; duplicate: boolean }>;
  list(query: QuoteListQuery): Promise<QuoteList>;
  get(reference: string): Promise<{ record: QuoteRecord; events: QuoteEvent[] } | null>;
  setStatus(reference: string, status: QuoteStatus, actor: string): Promise<QuoteRecord | null>;
  addNote(reference: string, note: string, actor: string): Promise<QuoteEvent | null>;
}

export function toSummary(r: QuoteRecord): QuoteSummary {
  return {
    reference: r.reference,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    status: r.status,
    name: r.customer.name,
    phone: r.customer.phone,
    locality: r.customer.locality,
    projectType: r.customer.projectType,
    timeline: r.customer.timeline,
    siteVisit: r.customer.siteVisit,
    doors: r.totals.doors,
    total: r.totals.total,
  };
}

export function emptyCounts(): Record<QuoteStatus, number> {
  return { new: 0, contacted: 0, visit: 0, quoted: 0, won: 0, lost: 0 };
}

/** Normalises free-text search to characters safe for every backend's filter syntax. */
export function cleanSearch(q: string | undefined): string {
  return (q ?? "").replace(/[^\p{L}\p{N}\s+@.-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export class StoreError extends Error {}
