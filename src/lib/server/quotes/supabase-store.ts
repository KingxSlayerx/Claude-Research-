import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { QuoteStatus } from "@/domain/catalog";
import type { QuoteEvent, QuoteRecord, StoredLine } from "@/domain/quote";
import type { QuoteTotals } from "@/domain/pricing";
import { cleanSearch, emptyCounts, StoreError, type NewQuote, type QuoteList, type QuoteListQuery, type QuoteStore, type QuoteSummary } from "./types";

interface Row {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  status: QuoteStatus;
  customer_name: string;
  phone: string;
  email: string | null;
  locality: string;
  project_type: string;
  timeline: string;
  site_visit: boolean;
  notes: string | null;
  items: StoredLine[];
  totals: QuoteTotals;
  subtotal: number;
  gst: number;
  total: number;
  pricing_version: string;
}

interface EventRow {
  id: string;
  quote_id: string;
  created_at: string;
  actor: string;
  kind: QuoteEvent["kind"];
  from_status: QuoteStatus | null;
  to_status: QuoteStatus | null;
  note: string | null;
}

const LIST_COLUMNS = "reference,created_at,updated_at,status,customer_name,phone,locality,project_type,timeline,site_visit,totals,total";

function toRecord(r: Row): QuoteRecord {
  return {
    id: r.id,
    reference: r.reference,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    status: r.status,
    customer: {
      name: r.customer_name,
      phone: r.phone,
      email: r.email ?? "",
      locality: r.locality,
      projectType: r.project_type as QuoteRecord["customer"]["projectType"],
      timeline: r.timeline as QuoteRecord["customer"]["timeline"],
      siteVisit: r.site_visit,
      notes: r.notes ?? "",
    },
    items: r.items,
    totals: r.totals,
    pricingVersion: r.pricing_version,
  };
}

function toEvent(e: EventRow): QuoteEvent {
  return {
    id: e.id,
    quoteId: e.quote_id,
    createdAt: e.created_at,
    actor: e.actor,
    kind: e.kind,
    fromStatus: e.from_status,
    toStatus: e.to_status,
    note: e.note,
  };
}

/**
 * Supabase (Postgres) store. Uses the service-role key, which bypasses row
 * level security, so this module must only ever run on the server.
 */
export class SupabaseQuoteStore implements QuoteStore {
  readonly kind = "supabase" as const;
  private db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async create(input: NewQuote, makeReference: () => string) {
    const existing = await this.db.from("quote_requests").select("*").eq("idempotency_key", input.idempotencyKey).maybeSingle<Row>();
    if (existing.error) throw new StoreError(existing.error.message);
    if (existing.data) return { record: toRecord(existing.data), duplicate: true };

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await this.db
        .from("quote_requests")
        .insert({
          reference: makeReference(),
          idempotency_key: input.idempotencyKey,
          customer_name: input.customer.name,
          phone: input.customer.phone,
          email: input.customer.email || null,
          locality: input.customer.locality,
          project_type: input.customer.projectType,
          timeline: input.customer.timeline,
          site_visit: input.customer.siteVisit,
          notes: input.customer.notes || null,
          items: input.items,
          totals: input.totals,
          subtotal: input.totals.subtotal,
          gst: input.totals.gst,
          total: input.totals.total,
          pricing_version: input.pricingVersion,
        })
        .select("*")
        .single<Row>();
      if (!error && data) {
        await this.db.from("quote_events").insert({ quote_id: data.id, actor: "customer", kind: "created", to_status: "new" });
        return { record: toRecord(data), duplicate: false };
      }
      // 23505 = unique violation: a concurrent retry with the same key, or a reference collision.
      if (error?.code === "23505") {
        const again = await this.db.from("quote_requests").select("*").eq("idempotency_key", input.idempotencyKey).maybeSingle<Row>();
        if (again.data) return { record: toRecord(again.data), duplicate: true };
        continue;
      }
      throw new StoreError(error?.message ?? "Insert failed");
    }
    throw new StoreError("Could not allocate a unique reference");
  }

  async list(query: QuoteListQuery): Promise<QuoteList> {
    let q = this.db.from("quote_requests").select(LIST_COLUMNS, { count: "exact" }).order("created_at", { ascending: false }).limit(query.limit ?? 100);
    if (query.status && query.status !== "all") q = q.eq("status", query.status);
    const term = cleanSearch(query.search);
    if (term) {
      const like = `%${term}%`;
      const digits = term.replace(/\D/g, "");
      const ors = [`reference.ilike.${like}`, `customer_name.ilike.${like}`, `locality.ilike.${like}`, `email.ilike.${like}`];
      if (digits.length >= 3) ors.push(`phone.ilike.%${digits.slice(-5)}%`);
      q = q.or(ors.join(","));
    }
    const [{ data, error, count }, countsRes] = await Promise.all([q, this.db.rpc("quote_status_counts")]);
    if (error) throw new StoreError(error.message);
    if (countsRes.error) throw new StoreError(countsRes.error.message);
    const counts = emptyCounts();
    for (const c of (countsRes.data ?? []) as { status: QuoteStatus; count: number }[]) counts[c.status] = Number(c.count);
    const items: QuoteSummary[] = ((data ?? []) as unknown as Row[]).map((r) => ({
      reference: r.reference,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      status: r.status,
      name: r.customer_name,
      phone: r.phone,
      locality: r.locality,
      projectType: r.project_type,
      timeline: r.timeline,
      siteVisit: r.site_visit,
      doors: r.totals?.doors ?? 0,
      total: r.total,
    }));
    return { items, counts, matched: count ?? items.length };
  }

  async get(reference: string) {
    const { data, error } = await this.db.from("quote_requests").select("*").eq("reference", reference).maybeSingle<Row>();
    if (error) throw new StoreError(error.message);
    if (!data) return null;
    const ev = await this.db.from("quote_events").select("*").eq("quote_id", data.id).order("created_at", { ascending: true });
    if (ev.error) throw new StoreError(ev.error.message);
    return { record: toRecord(data), events: ((ev.data ?? []) as EventRow[]).map(toEvent) };
  }

  async setStatus(reference: string, status: QuoteStatus, actor: string) {
    const { data, error } = await this.db.rpc("set_quote_status", { p_reference: reference, p_status: status, p_actor: actor }).maybeSingle<Row>();
    if (error) throw new StoreError(error.message);
    return data && data.id ? toRecord(data) : null;
  }

  async addNote(reference: string, note: string, actor: string) {
    const { data: q, error } = await this.db.from("quote_requests").select("id").eq("reference", reference).maybeSingle<{ id: string }>();
    if (error) throw new StoreError(error.message);
    if (!q) return null;
    const ins = await this.db.from("quote_events").insert({ quote_id: q.id, actor, kind: "note", note }).select("*").single<EventRow>();
    if (ins.error) throw new StoreError(ins.error.message);
    await this.db.from("quote_requests").update({ updated_at: new Date().toISOString() }).eq("id", q.id);
    return toEvent(ins.data);
  }
}
