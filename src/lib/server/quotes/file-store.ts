import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { QUOTE_STATUSES, type QuoteStatus } from "@/domain/catalog";
import type { QuoteEvent, QuoteRecord } from "@/domain/quote";
import { cleanSearch, emptyCounts, toSummary, type NewQuote, type QuoteList, type QuoteListQuery, type QuoteStore } from "./types";

interface FileData {
  quotes: (QuoteRecord & { idempotencyKey: string })[];
  events: QuoteEvent[];
}

/**
 * JSON-file store for local development, automated tests and single-server
 * self-hosting. Writes are serialised in-process and replaced atomically.
 * Not suitable for serverless or multi-instance hosting.
 */
export class FileQuoteStore implements QuoteStore {
  readonly kind = "file" as const;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly file: string) {}

  private async read(): Promise<FileData> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      const data = JSON.parse(raw) as FileData;
      return { quotes: data.quotes ?? [], events: data.events ?? [] };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return { quotes: [], events: [] };
      throw e;
    }
  }

  private async write(data: FileData) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 1), { mode: 0o600 });
    await fs.rename(tmp, this.file);
  }

  /** Runs read-modify-write operations one at a time. */
  private exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  create(input: NewQuote, makeReference: () => string) {
    return this.exclusive(async () => {
      const data = await this.read();
      const existing = data.quotes.find((q) => q.idempotencyKey === input.idempotencyKey);
      if (existing) return { record: strip(existing), duplicate: true };
      let reference = makeReference();
      while (data.quotes.some((q) => q.reference === reference)) reference = makeReference();
      const now = new Date().toISOString();
      const record: QuoteRecord & { idempotencyKey: string } = {
        ...input,
        id: randomUUID(),
        reference,
        createdAt: now,
        updatedAt: now,
        status: "new",
      };
      data.quotes.push(record);
      data.events.push({ id: randomUUID(), quoteId: record.id, createdAt: now, actor: "customer", kind: "created", toStatus: "new" });
      await this.write(data);
      return { record: strip(record), duplicate: false };
    });
  }

  async list(query: QuoteListQuery): Promise<QuoteList> {
    const data = await this.read();
    const counts = emptyCounts();
    for (const q of data.quotes) counts[q.status]++;
    const term = cleanSearch(query.search).toLowerCase();
    const digits = term.replace(/\D/g, "");
    const matched = data.quotes
      .filter((q) => !query.status || query.status === "all" || q.status === query.status)
      .filter((q) => {
        if (!term) return true;
        const hay = [q.reference, q.customer.name, q.customer.locality, q.customer.email].join(" ").toLowerCase();
        return hay.includes(term) || (digits.length >= 3 && q.customer.phone.replace(/\D/g, "").includes(digits));
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: matched.slice(0, query.limit ?? 100).map(toSummary), counts, matched: matched.length };
  }

  async get(reference: string) {
    const data = await this.read();
    const q = data.quotes.find((x) => x.reference === reference);
    if (!q) return null;
    return {
      record: strip(q),
      events: data.events.filter((e) => e.quoteId === q.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  }

  setStatus(reference: string, status: QuoteStatus, actor: string) {
    return this.exclusive(async () => {
      if (!QUOTE_STATUSES.some((s) => s.id === status)) return null;
      const data = await this.read();
      const q = data.quotes.find((x) => x.reference === reference);
      if (!q) return null;
      if (q.status !== status) {
        const now = new Date().toISOString();
        data.events.push({ id: randomUUID(), quoteId: q.id, createdAt: now, actor, kind: "status", fromStatus: q.status, toStatus: status });
        q.status = status;
        q.updatedAt = now;
        await this.write(data);
      }
      return strip(q);
    });
  }

  addNote(reference: string, note: string, actor: string) {
    return this.exclusive(async () => {
      const data = await this.read();
      const q = data.quotes.find((x) => x.reference === reference);
      if (!q) return null;
      const now = new Date().toISOString();
      const ev: QuoteEvent = { id: randomUUID(), quoteId: q.id, createdAt: now, actor, kind: "note", note };
      data.events.push(ev);
      q.updatedAt = now;
      await this.write(data);
      return ev;
    });
  }
}

function strip(q: QuoteRecord & { idempotencyKey?: string }): QuoteRecord {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { idempotencyKey, ...rest } = q;
  return rest;
}
