import "server-only";
import { randomInt } from "node:crypto";
import { BUSINESS_RULES, PRICING_VERSION } from "@/domain/catalog";
import { priceDoor, quoteTotals } from "@/domain/pricing";
import { summarize } from "@/domain/summary";
import { formatIndianMobile, normalizeIndianMobile, normalizeItems, type CustomerDetails, type QuoteRecord } from "@/domain/quote";
import { fileStorePath, storeKind, supabaseConfig } from "../env";
import { FileQuoteStore } from "./file-store";
import { SupabaseQuoteStore } from "./supabase-store";
import type { QuoteStore } from "./types";

let cached: { key: string; store: QuoteStore } | null = null;

/** Returns the configured store, or null when quote storage is not set up. */
export function getQuoteStore(): QuoteStore | null {
  const kind = storeKind();
  if (!kind) return null;
  const key = kind === "file" ? `file:${fileStorePath()}` : `supabase:${supabaseConfig()!.url}`;
  if (cached?.key === key) return cached.store;
  const store = kind === "file" ? new FileQuoteStore(fileStorePath()) : new SupabaseQuoteStore(supabaseConfig()!.url, supabaseConfig()!.serviceRoleKey);
  cached = { key, store };
  return store;
}

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I

/** TH-YYMMDD-XXXXX, dated in India Standard Time. */
export function makeReference(now = new Date()): string {
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  const ymd = ist.toISOString().slice(2, 10).replace(/-/g, "");
  let code = "";
  for (let i = 0; i < 5; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `${BUSINESS_RULES.referencePrefix}-${ymd}-${code}`;
}

/**
 * Builds the stored record from validated customer details and untrusted
 * door configurations. Prices are always recomputed here.
 */
export function buildQuote(customer: CustomerDetails, rawItems: unknown[], idempotencyKey: string) {
  const configs = normalizeItems(rawItems);
  if (!configs) return null;
  const phone = normalizeIndianMobile(customer.phone);
  if (!phone) return null;
  const items = configs.map((config) => {
    const est = priceDoor(config);
    return { config, summary: summarize(config), unit: est.unit, lines: est.lines };
  });
  const totals = quoteTotals(configs);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { consent, ...rest } = customer;
  const record: Omit<QuoteRecord, "id" | "reference" | "createdAt" | "updatedAt" | "status"> & { idempotencyKey: string } = {
    idempotencyKey,
    customer: { ...rest, phone: formatIndianMobile(phone) },
    items,
    totals,
    pricingVersion: PRICING_VERSION,
  };
  return record;
}
