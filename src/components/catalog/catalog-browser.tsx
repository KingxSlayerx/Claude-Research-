"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { COLLECTIONS, ROOMS, STYLES, type CollectionId, type RoomId } from "@/domain/catalog";

type Filter<T extends string> = T | "all";

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
  name,
}: {
  label: string;
  name: string;
  options: { id: T; label: string }[];
  value: Filter<T>;
  onChange: (v: Filter<T>) => void;
}) {
  const all = [{ id: "all" as const, label: "All" }, ...options];
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <legend className="eyebrow mb-3 shrink-0 sm:float-left sm:mb-0 sm:w-24">{label}</legend>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {all.map((o) => (
          <label key={o.id} className="relative shrink-0 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id as Filter<T>)}
              className="peer sr-only"
            />
            <span className="block rounded-full border border-line-strong/70 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Room and collection filters, kept in the URL so filtered views can be shared.
 * Cards are rendered on the server and passed in by style id.
 */
export function CatalogBrowser({ cards }: { cards: Record<string, ReactNode> }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomParam = params.get("room");
  const colParam = params.get("collection");
  const room: Filter<RoomId> = ROOMS.some((r) => r.id === roomParam) ? (roomParam as RoomId) : "all";
  const collection: Filter<CollectionId> = COLLECTIONS.some((c) => c.id === colParam) ? (colParam as CollectionId) : "all";

  const update = (key: "room" | "collection", v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v === "all") next.delete(key);
    else next.set(key, v);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const list = STYLES.filter(
    (s) => (room === "all" || s.rooms.includes(room)) && (collection === "all" || s.collections.includes(collection)),
  );
  const activeCollection = COLLECTIONS.find((c) => c.id === collection);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-5 border-y border-line py-6">
        <FilterRow label="Room" name="room" options={ROOMS} value={room} onChange={(v) => update("room", v)} />
        <FilterRow label="Collection" name="collection" options={COLLECTIONS} value={collection} onChange={(v) => update("collection", v)} />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p aria-live="polite" className="text-sm text-muted">
          Showing {list.length} of {STYLES.length} designs
          {activeCollection ? ` · ${activeCollection.description}` : ""}
        </p>
      </div>

      {list.length ? (
        <ul className="grid gap-x-6 gap-y-16 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => (
            <li key={s.id}>{cards[s.id]}</li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong p-10">
          <h2 className="font-display text-display-s">No designs match both filters.</h2>
          <p className="text-ink-soft">Try a different room or collection, or view everything.</p>
          <button
            type="button"
            className="rounded-full border border-ink px-5 py-2 text-sm hover:bg-ink hover:text-paper"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
