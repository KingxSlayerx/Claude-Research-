"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useQuoteStore } from "./quote-store";

/** Rehydrates the persisted quote store once, after the first client render. */
export function StoreHydrator() {
  useEffect(() => {
    if (!useQuoteStore.persist.hasHydrated()) void useQuoteStore.persist.rehydrate();
  }, []);
  return null;
}

const subscribe = (cb: () => void) => useQuoteStore.persist.onFinishHydration(cb);

/** True once persisted customer state has loaded. Server render and first paint are always false. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => useQuoteStore.persist.hasHydrated(),
    () => false,
  );
}
