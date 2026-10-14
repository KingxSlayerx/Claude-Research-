"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QUOTE_STATUSES, getRoom, getStatus, type QuoteStatus } from "@/domain/catalog";
import { formatDateTime, inr, plural } from "@/domain/format";
import { specRows } from "@/domain/summary";
import type { QuoteEvent, QuoteRecord } from "@/domain/quote";
import { DoorArt } from "@/components/ui/door-art";
import { TotalsPanel } from "@/components/quote/totals-panel";
import { PriceBreakdown } from "@/components/quote/price-breakdown";
import { adminFetch, SignedOutError } from "./admin-shell";
import { StatusPill } from "./status-pill";

type Data = { record: QuoteRecord; events: QuoteEvent[] };

export function QuoteDetail({ reference }: { reference: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ status: "loading" } | { status: "ready"; data: Data } | { status: "error"; message: string; notFound?: boolean }>({
    status: "loading",
  });
  const [saving, setSaving] = useState<QuoteStatus | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [note, setNote] = useState("");
  const [noteState, setNoteState] = useState<{ sending: boolean; error?: string }>({ sending: false });

  const onError = useCallback(
    (e: unknown) => {
      if (e instanceof SignedOutError) {
        router.replace(`/admin/login?next=/admin/quotes/${reference}`);
        return true;
      }
      return false;
    },
    [router, reference],
  );

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<Data>(`/api/admin/quotes/${encodeURIComponent(reference)}`);
      setState({ status: "ready", data });
    } catch (e) {
      if (!onError(e)) setState({ status: "error", message: (e as Error).message, notFound: (e as Error).message.includes("not found") });
    }
  }, [reference, onError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  if (state.status === "loading") return <p className="text-muted" aria-busy="true">Loading request…</p>;
  if (state.status === "error")
    return (
      <div role="alert" className="flex flex-col items-start gap-3 border-l-2 border-error bg-error-soft p-5">
        <p>{state.notFound ? `No request with reference ${reference}.` : `Couldn't load this request: ${state.message}`}</p>
        <div className="flex gap-4">
          {!state.notFound && (
            <button type="button" className="underline" onClick={load}>
              Try again
            </button>
          )}
          <Link href="/admin" className="underline">
            Back to inbox
          </Link>
        </div>
      </div>
    );

  const { record: r, events } = state.data;
  const c = r.customer;
  const digits = c.phone.replace(/\D/g, "");
  const greeting = `Hello ${c.name.split(/\s+/)[0]}, this is Threshold about your quote request ${r.reference}.`;

  const changeStatus = async (next: QuoteStatus) => {
    if (next === r.status) return;
    setSaving(next);
    setStatusMsg(null);
    try {
      const data = await adminFetch<Data>(`/api/admin/quotes/${r.reference}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setState({ status: "ready", data });
      setStatusMsg({ tone: "ok", text: `Saved: ${getStatus(data.record.status)?.label}` });
    } catch (e) {
      if (!onError(e)) setStatusMsg({ tone: "error", text: `Not saved — ${(e as Error).message}` });
    } finally {
      setSaving(null);
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return setNoteState({ sending: false, error: "Write a note first." });
    setNoteState({ sending: true });
    try {
      const data = await adminFetch<Data>(`/api/admin/quotes/${r.reference}/notes`, { method: "POST", body: JSON.stringify({ note }) });
      setState({ status: "ready", data });
      setNote("");
      setNoteState({ sending: false });
    } catch (err) {
      if (!onError(err)) setNoteState({ sending: false, error: `Not saved — ${(err as Error).message}` });
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← All requests
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-display text-display-m">{c.name}</h1>
          <StatusPill status={r.status} />
        </div>
        <p className="tabular text-sm text-muted">
          {r.reference} · received {formatDateTime(r.createdAt)} · {plural(r.totals.doors, "door")} · {inr(r.totals.total)} incl. GST (estimate)
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-10 lg:col-span-8">
          <section aria-labelledby="contact-title" className="border border-line bg-paper p-6">
            <h2 id="contact-title" className="eyebrow mb-4">
              Customer & project
            </h2>
            <dl className="grid gap-x-8 gap-y-3 text-[0.95rem] sm:grid-cols-2">
              <Row label="Mobile" value={c.phone} />
              <Row label="Email" value={c.email || "—"} />
              <Row label="Locality" value={c.locality} />
              <Row label="Project" value={c.projectType} />
              <Row label="Needed by" value={c.timeline} />
              <Row label="Site measurement" value={c.siteVisit ? "Requested" : "Not requested"} />
            </dl>
            {c.notes && (
              <blockquote className="mt-5 border-l-2 border-brass bg-ivory px-4 py-3 text-[0.95rem] whitespace-pre-line">{c.notes}</blockquote>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`tel:+${digits}`} className="rounded-full bg-ink px-5 py-2 text-sm text-paper hover:bg-ink-soft">
                Call {c.phone}
              </a>
              <a href={`https://wa.me/${digits}?text=${encodeURIComponent(greeting)}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-ink px-5 py-2 text-sm hover:bg-ink hover:text-paper">
                WhatsApp
              </a>
              {c.email && (
                <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Your Threshold quote ${r.reference}`)}`} className="rounded-full border border-ink px-5 py-2 text-sm hover:bg-ink hover:text-paper">
                  Email
                </a>
              )}
            </div>
          </section>

          <section aria-labelledby="doors-title">
            <h2 id="doors-title" className="eyebrow mb-4">
              Doors
            </h2>
            <ol className="flex flex-col gap-4">
              {r.items.map((it, i) => (
                <li key={i} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-5 border border-line bg-paper p-5 sm:grid-cols-[7rem_minmax(0,1fr)]">
                  <div className="aspect-[4/5] bg-[#e8e0d2]">
                    <DoorArt config={it.config} mode="mini" decorative className="h-full w-full" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="font-display text-[1.6rem] leading-tight">
                        {it.config.qty} × {specRows(it.config)[0].value}
                        <span className="ml-2 text-base text-muted">{getRoom(it.config.room).label}</span>
                      </h3>
                      <span className="tabular">
                        {inr(it.unit * it.config.qty)} <span className="text-sm text-muted">({inr(it.unit)} each)</span>
                      </span>
                    </div>
                    <dl className="grid grid-cols-[7rem_minmax(0,1fr)] text-sm">
                      {specRows(it.config)
                        .slice(1)
                        .map((row) => (
                          <div key={row.label} className="col-span-2 grid grid-cols-subgrid border-b border-line py-1.5">
                            <dt className="text-muted">{row.label}</dt>
                            <dd>{row.value}</dd>
                          </div>
                        ))}
                    </dl>
                    <details>
                      <summary className="cursor-pointer text-sm text-ink-soft">Price lines at submission</summary>
                      <div className="mt-3">
                        <PriceBreakdown estimate={{ lines: it.lines, unit: it.unit, area: 0 }} compact />
                      </div>
                    </details>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-8 lg:col-span-4">
          <section aria-labelledby="status-title" className="border border-line bg-paper p-6">
            <h2 id="status-title" className="eyebrow mb-4">
              Status
            </h2>
            <fieldset disabled={saving !== null} className="flex flex-col gap-2">
              <legend className="sr-only">Request status</legend>
              {QUOTE_STATUSES.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 border border-line px-3 py-2 has-[:checked]:border-ink has-[:checked]:bg-ivory">
                  <input type="radio" name="status" value={s.id} checked={r.status === s.id} onChange={() => changeStatus(s.id)} className="accent-[var(--color-olive)]" />
                  <span className="text-sm">{s.label}</span>
                  {saving === s.id && <span className="ml-auto text-xs text-muted">Saving…</span>}
                </label>
              ))}
            </fieldset>
            <p aria-live="polite" className={`mt-3 min-h-5 text-sm ${statusMsg?.tone === "error" ? "text-error" : "text-olive"}`}>
              {statusMsg?.text}
            </p>
          </section>

          <section aria-labelledby="totals-title" className="border border-line bg-paper p-6">
            <h2 id="totals-title" className="eyebrow mb-4">
              Estimate at submission
            </h2>
            <TotalsPanel totals={r.totals} />
            <p className="mt-3 text-xs text-muted">Pricing version {r.pricingVersion}</p>
          </section>

          <section aria-labelledby="history-title" className="border border-line bg-paper p-6">
            <h2 id="history-title" className="eyebrow mb-4">
              Follow-up notes & history
            </h2>
            <form onSubmit={addNote} className="flex flex-col gap-2">
              <label htmlFor="note" className="sr-only">
                Add a note
              </label>
              <textarea
                id="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Called, booked visit for Saturday 11am…"
                className="w-full border border-line bg-ivory px-3 py-2 text-sm outline-none focus:border-ink"
              />
              {noteState.error && <p className="text-sm text-error">{noteState.error}</p>}
              <button type="submit" disabled={noteState.sending} className="self-start rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50">
                {noteState.sending ? "Saving…" : "Add note"}
              </button>
            </form>
            <ol className="mt-6 flex flex-col gap-4 border-l border-line pl-4">
              {[...events].reverse().map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="tabular text-xs text-muted">
                    {formatDateTime(e.createdAt)} · {e.actor}
                  </p>
                  <p className="whitespace-pre-line">
                    {e.kind === "created" && "Request received"}
                    {e.kind === "status" && `Status: ${getStatus(e.fromStatus ?? "")?.label ?? "—"} → ${getStatus(e.toStatus ?? "")?.label}`}
                    {e.kind === "note" && e.note}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
