"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QUOTE_STATUSES, type QuoteStatus } from "@/domain/catalog";
import { formatDateTime, inr, plural } from "@/domain/format";
import type { QuoteList } from "@/lib/server/quotes/types";
import { adminFetch, SignedOutError } from "./admin-shell";
import { StatusPill } from "./status-pill";

type Load = { status: "loading" } | { status: "ready"; data: QuoteList } | { status: "error"; message: string };

export function Inbox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<QuoteStatus | "all">("all");
  const [state, setState] = useState<Load>({ status: "loading" });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setState((s) => (s.status === "ready" ? s : { status: "loading" }));
    try {
      const params = new URLSearchParams({ status: filter });
      if (debounced) params.set("q", debounced);
      const data = await adminFetch<QuoteList>(`/api/admin/quotes?${params}`);
      setState({ status: "ready", data });
    } catch (e) {
      if (e instanceof SignedOutError) router.replace("/admin/login?next=/admin");
      else setState({ status: "error", message: (e as Error).message });
    }
  }, [filter, debounced, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change
    void load();
  }, [load]);

  const counts = state.status === "ready" ? state.data.counts : null;
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-m">Quote requests</h1>
          <p className="text-sm text-muted">Newest first. Open a request to call, message or update its status.</p>
        </div>
        <button type="button" onClick={load} className="rounded-full border border-line-strong px-4 py-2 text-sm hover:bg-stone">
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="radiogroup" aria-label="Filter by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
          {[{ id: "all" as const, label: "All" }, ...QUOTE_STATUSES].map((s) => {
            const n = counts ? (s.id === "all" ? total : counts[s.id]) : null;
            const on = filter === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setFilter(s.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm ${on ? "border-ink bg-ink text-paper" : "border-line-strong text-ink-soft hover:border-ink"}`}
              >
                {s.label}
                {n !== null && <span className="tabular ml-2 opacity-70">{n}</span>}
              </button>
            );
          })}
        </div>
        <label className="relative block lg:w-80">
          <span className="sr-only">Search requests</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, locality, reference"
            className="w-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink"
          />
        </label>
      </div>

      {state.status === "loading" && (
        <ul aria-busy="true" aria-label="Loading requests" className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="h-20 animate-pulse bg-stone/70" />
          ))}
        </ul>
      )}
      {state.status === "error" && (
        <div role="alert" className="flex flex-col items-start gap-3 border-l-2 border-error bg-error-soft p-5">
          <p>Couldn&rsquo;t load requests: {state.message}</p>
          <button type="button" className="underline" onClick={load}>
            Try again
          </button>
        </div>
      )}
      {state.status === "ready" &&
        (state.data.items.length === 0 ? (
          <div className="border border-dashed border-line-strong p-10 text-center">
            <h2 className="font-display text-display-s">{total === 0 ? "No requests yet" : "Nothing matches"}</h2>
            <p className="mt-2 text-ink-soft">
              {total === 0 ? "When a customer sends a quote, it appears here with their doors, contact and site details." : "Try another status or search term."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted" aria-live="polite">
              {plural(state.data.matched, "request")}
              {state.data.matched > state.data.items.length ? ` · showing the latest ${state.data.items.length}` : ""}
            </p>
            <ul className="flex flex-col border-t border-line">
              {state.data.items.map((r) => (
                <li key={r.reference}>
                  <Link
                    href={`/admin/quotes/${r.reference}`}
                    className={`grid gap-x-6 gap-y-1 border-b border-line px-2 py-4 transition-colors hover:bg-paper sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] ${r.status === "new" ? "border-l-2 border-l-olive" : ""}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.name}</span>
                      <span className="tabular block text-sm text-muted">
                        {r.reference} · {formatDateTime(r.createdAt)}
                      </span>
                    </span>
                    <span className="min-w-0 text-sm text-ink-soft">
                      <span className="block truncate">
                        {r.locality} · {r.projectType}
                      </span>
                      <span className="block">
                        {plural(r.doors, "door")} · {r.timeline}
                        {r.siteVisit ? " · wants site measurement" : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                      <StatusPill status={r.status} />
                      <span className="tabular text-sm">{inr(r.total)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ))}
    </div>
  );
}
