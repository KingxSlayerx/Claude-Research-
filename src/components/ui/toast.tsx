"use client";

import { create } from "zustand";
import { useEffect } from "react";

interface Toast {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

const useToasts = create<{ toast: Toast | null; show: (t: Omit<Toast, "id">) => void; clear: () => void }>((set) => ({
  toast: null,
  show: (t) => set({ toast: { ...t, id: Date.now() } }),
  clear: () => set({ toast: null }),
}));

export const toast = (message: string, action?: Toast["action"]) => useToasts.getState().show({ message, action });

/** Polite live region for confirmations ("Added to your quote", "Removed — Undo"). */
export function Toaster() {
  const { toast: t, clear } = useToasts();
  useEffect(() => {
    if (!t) return;
    const timer = setTimeout(clear, t.action ? 6000 : 3200);
    return () => clearTimeout(timer);
  }, [t, clear]);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8">
      {t && (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-4 rounded-full bg-ink py-3 pl-5 pr-3 text-sm text-paper shadow-lift motion-safe:animate-[toast-in_.35s_var(--ease-out-soft)]"
        >
          <span>{t.message}</span>
          {t.action ? (
            <button
              type="button"
              className="rounded-full px-3 py-1 font-semibold text-brass-light hover:bg-white/10"
              onClick={() => {
                t.action?.onClick();
                clear();
              }}
            >
              {t.action.label}
            </button>
          ) : (
            <span className="w-2" />
          )}
        </div>
      )}
    </div>
  );
}
