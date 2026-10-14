"use client";

/**
 * Customer-side state: the door being designed, the draft quote and the
 * contact form. Persisted to localStorage so a customer can come back to
 * their project. Everything read back from storage is re-validated.
 * Nothing in here is the source of truth for submitted quotes — those live
 * on the server.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PROJECT_TYPES, TIMELINES, getStyle, type StyleId } from "@/domain/catalog";
import { applyChange, clampQty, defaultConfig, normalizeConfig, type ConfigChange, type DoorConfig } from "@/domain/config";

export interface QuoteItem {
  id: string;
  config: DoorConfig;
}

export interface CustomerDraft {
  name: string;
  phone: string;
  email: string;
  locality: string;
  projectType: (typeof PROJECT_TYPES)[number];
  timeline: (typeof TIMELINES)[number];
  siteVisit: boolean;
  notes: string;
}

export interface SubmittedQuote {
  reference: string;
  createdAt: string;
  doors: number;
  total: number;
  siteVisit: boolean;
}

interface QuoteState {
  draft: DoorConfig;
  editingId: string | null;
  items: QuoteItem[];
  customer: CustomerDraft;
  submissions: SubmittedQuote[];

  startDesign: (style: StyleId, room?: string) => void;
  change: (c: ConfigChange) => void;
  setDraft: (c: DoorConfig) => void;
  /** Adds the draft as a new line, or saves it over the line being edited. Returns the item id. */
  commitDraft: () => { id: string; updated: boolean };
  editItem: (id: string) => boolean;
  cancelEdit: () => void;
  duplicateItem: (id: string) => void;
  removeItem: (id: string) => void;
  restoreItem: (item: QuoteItem, index: number) => void;
  setItemQty: (id: string, qty: number) => void;
  updateCustomer: (patch: Partial<CustomerDraft>) => void;
  recordSubmission: (s: SubmittedQuote) => void;
}

export const EMPTY_CUSTOMER: CustomerDraft = {
  name: "",
  phone: "",
  email: "",
  locality: "",
  projectType: "New home",
  timeline: "1–2 months",
  siteVisit: true,
  notes: "",
};

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);

const DEFAULT_STYLE: StyleId = "panel4";

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      draft: defaultConfig(DEFAULT_STYLE),
      editingId: null,
      items: [],
      customer: EMPTY_CUSTOMER,
      submissions: [],

      startDesign: (style, room) => {
        // Mirrors the original: keep the browsing room filter if the style suits that room.
        const cfg = defaultConfig(style);
        const suits = getStyle(style).rooms.some((r) => r === room);
        set({ draft: suits ? { ...cfg, room: room as DoorConfig["room"] } : cfg, editingId: null });
      },
      change: (c) => set({ draft: applyChange(get().draft, c) }),
      setDraft: (c) => set({ draft: c }),
      commitDraft: () => {
        const { draft, editingId, items } = get();
        if (editingId && items.some((i) => i.id === editingId)) {
          set({ items: items.map((i) => (i.id === editingId ? { ...i, config: { ...draft } } : i)), editingId: null });
          return { id: editingId, updated: true };
        }
        const id = newId();
        set({ items: [...items, { id, config: { ...draft } }], editingId: null });
        return { id, updated: false };
      },
      editItem: (id) => {
        const it = get().items.find((i) => i.id === id);
        if (!it) return false;
        set({ draft: { ...it.config }, editingId: id });
        return true;
      },
      cancelEdit: () => set({ editingId: null }),
      duplicateItem: (id) => {
        const items = get().items;
        const idx = items.findIndex((i) => i.id === id);
        if (idx < 0) return;
        const copy = { id: newId(), config: { ...items[idx].config } };
        set({ items: [...items.slice(0, idx + 1), copy, ...items.slice(idx + 1)] });
      },
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id), editingId: s.editingId === id ? null : s.editingId })),
      restoreItem: (item, index) =>
        set((s) => {
          const items = [...s.items];
          items.splice(Math.min(index, items.length), 0, item);
          return { items };
        }),
      setItemQty: (id, qty) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, config: { ...i.config, qty: clampQty(qty) } } : i)) })),
      updateCustomer: (patch) => set((s) => ({ customer: { ...s.customer, ...patch } })),
      recordSubmission: (sub) =>
        set((s) => ({ submissions: [sub, ...s.submissions].slice(0, 20), items: [], editingId: null })),
    }),
    {
      name: "threshold.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        draft: s.draft,
        editingId: s.editingId,
        items: s.items,
        customer: s.customer,
        submissions: s.submissions,
      }),
      merge: (persisted, current) => sanitizePersisted(persisted, current),
    },
  ),
);

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function sanitizePersisted(persisted: unknown, current: QuoteState): QuoteState {
  const p = (persisted && typeof persisted === "object" ? persisted : readLegacy()) as Record<string, unknown> | null;
  if (!p) return current;
  const items = Array.isArray(p.items)
    ? (p.items as unknown[]).flatMap((it) => {
        const rec = it as { id?: unknown; config?: unknown };
        const config = normalizeConfig(rec?.config);
        return config ? [{ id: typeof rec.id === "string" ? rec.id : newId(), config }] : [];
      })
    : [];
  const c = (p.customer ?? {}) as Record<string, unknown>;
  const customer: CustomerDraft = {
    name: str(c.name, 80),
    phone: str(c.phone, 20),
    email: str(c.email, 120),
    locality: str(c.locality, 80),
    projectType: PROJECT_TYPES.includes(c.projectType as never) ? (c.projectType as CustomerDraft["projectType"]) : EMPTY_CUSTOMER.projectType,
    timeline: TIMELINES.includes(c.timeline as never) ? (c.timeline as CustomerDraft["timeline"]) : EMPTY_CUSTOMER.timeline,
    siteVisit: typeof c.siteVisit === "boolean" ? c.siteVisit : true,
    notes: str(c.notes, 1000),
  };
  const submissions = Array.isArray(p.submissions)
    ? (p.submissions as SubmittedQuote[]).filter((s) => s && typeof s.reference === "string" && typeof s.createdAt === "string").slice(0, 20)
    : [];
  const editingId = typeof p.editingId === "string" && items.some((i) => i.id === p.editingId) ? p.editingId : null;
  return {
    ...current,
    draft: normalizeConfig(p.draft) ?? current.draft,
    editingId,
    items,
    customer,
    submissions,
  };
}

/**
 * One-time import of a customer's in-progress design and quote from the
 * original single-page site (keys th.cfg, th.quote, th.form).
 */
function readLegacy(): Record<string, unknown> | null {
  try {
    const get = (k: string) => {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    };
    const cfg = get("th.cfg");
    const quote = get("th.quote");
    const form = get("th.form");
    if (!cfg && !quote && !form) return null;
    return {
      draft: cfg,
      items: Array.isArray(quote) ? quote.map((q: { id?: string; cfg?: unknown }) => ({ id: q?.id, config: q?.cfg })) : [],
      customer: form
        ? { ...form, locality: form.area, projectType: form.type, timeline: form.when, siteVisit: form.visit }
        : undefined,
    };
  } catch {
    return null;
  }
}
