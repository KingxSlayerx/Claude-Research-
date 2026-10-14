"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/site/wordmark";

export interface Staff {
  name: string;
  email: string;
  role: "staff" | "admin";
}

const StaffContext = createContext<Staff | null>(null);
export const useStaff = () => useContext(StaffContext);

/** Thrown by adminFetch when the session has expired. */
export class SignedOutError extends Error {}

export async function adminFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, cache: "no-store" });
  if (res.status === 401) throw new SignedOutError("Signed out");
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* empty */
  }
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? `Request failed (${res.status})`);
  return body as T;
}

/**
 * Loads the staff session before rendering any admin content. This is a UX
 * guard only — every admin API route verifies the session itself.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<{ status: "loading" } | { status: "ready"; staff: Staff } | { status: "error"; message: string }>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const { staff } = await adminFetch<{ staff: Staff }>("/api/admin/session");
      setState({ status: "ready", staff });
    } catch (e) {
      if (e instanceof SignedOutError) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      else setState({ status: "error", message: (e as Error).message });
    }
  }, [router, pathname]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session fetch
    void load();
  }, [load]);

  const signOut = async () => {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
    router.replace("/admin/login");
  };

  return (
    <div className="flex min-h-svh flex-col bg-ivory">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Wordmark />
            <span className="hidden border-l border-line pl-3 text-sm text-muted sm:inline">Showroom inbox</span>
          </Link>
          <div className="ml-auto flex items-center gap-4 text-sm">
            {state.status === "ready" && (
              <>
                <span className="hidden text-ink-soft sm:inline">{state.staff.name}</span>
                <button type="button" onClick={signOut} className="rounded-full border border-line-strong px-4 py-1.5 hover:bg-stone">
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:py-10">
        {state.status === "loading" && <p className="text-muted" aria-busy="true">Checking your session…</p>}
        {state.status === "error" && (
          <div role="alert" className="flex flex-col items-start gap-3 border-l-2 border-error bg-error-soft p-5">
            <p>{state.message}</p>
            <button type="button" className="underline" onClick={load}>
              Try again
            </button>
          </div>
        )}
        {state.status === "ready" && <StaffContext value={state.staff}>{children}</StaffContext>}
      </main>
    </div>
  );
}
