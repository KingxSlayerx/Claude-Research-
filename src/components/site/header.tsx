"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuoteStore } from "@/state/quote-store";
import { useHydrated } from "@/state/hydration";
import { Wordmark } from "./wordmark";

const NAV = [
  { href: "/doors", label: "Doors" },
  { href: "/#collections", label: "Collections" },
  { href: "/#craft", label: "Materials" },
  { href: "/#approach", label: "Our approach" },
  { href: "/visualise", label: "See it at home" },
];

/** Slim global navigation. Dark and translucent over the home hero, light elsewhere. */
export function Header() {
  const pathname = usePathname();
  const dark = pathname === "/";
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const doors = useQuoteStore((s) => s.items.reduce((a, i) => a + i.config.qty, 0));
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
      if (e.key === "Tab" && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>("a,button")];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tone = dark && !open ? "text-white/85 hover:text-white" : "text-ink/80 hover:text-ink";
  const count = hydrated && doors > 0 ? doors : 0;

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-colors duration-300 ${
          dark && !open ? "bg-[rgba(13,12,11,0.72)] backdrop-blur-xl backdrop-saturate-150" : "border-b border-black/[0.06] bg-[rgba(251,250,248,0.8)] backdrop-blur-xl backdrop-saturate-150"
        }`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <div className="mx-auto flex h-12 max-w-[1100px] items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="mr-auto shrink-0 lg:mr-0" aria-label="Threshold, home">
            <Wordmark compact tone={dark && !open ? "paper" : "ink"} />
          </Link>
          <nav aria-label="Main" className="hidden flex-1 lg:block">
            <ul className="flex items-center justify-center gap-8 text-[0.78rem] tracking-[-0.005em]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className={`transition-colors ${tone}`} aria-current={pathname === n.href ? "page" : undefined}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link href="/quote" className={`relative inline-flex h-8 items-center gap-1.5 text-[0.78rem] transition-colors ${tone}`} aria-label={count ? `Your quote, ${count} door${count === 1 ? "" : "s"}` : "Your quote"}>
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.3">
              <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
              <path d="M7 7h6M7 10h6M7 13h3.5" />
            </svg>
            <span className="max-sm:sr-only">Quote</span>
            {count > 0 && <span className="tabular rounded-full bg-olive px-1.5 text-[0.68rem] font-semibold leading-[1.15rem] text-white">{count}</span>}
          </Link>
          <Link href="/design" className="inline-flex h-7 items-center rounded-full bg-olive px-3.5 text-[0.75rem] font-medium text-white transition-colors hover:bg-olive-deep max-sm:hidden">
            Design your door
          </Link>
          <button
            ref={menuButton}
            type="button"
            className={`-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden ${dark && !open ? "text-white" : "text-ink"}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="relative block h-3 w-[18px]">
              <span className={`absolute left-0 h-px w-[18px] bg-current transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0.5"}`} />
              <span className={`absolute left-0 h-px w-[18px] bg-current transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-2.5"}`} />
            </span>
          </button>
        </div>
      </header>

      <div id="mobile-menu" ref={panel} hidden={!open} className="fixed inset-x-0 bottom-0 top-12 z-40 overflow-y-auto bg-ivory lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
        <nav aria-label="Mobile" className="flex min-h-full flex-col px-8 pb-10 pt-6">
          <ul className="flex flex-col gap-1">
            {[...NAV, { href: "/quote", label: count ? `Quote (${count})` : "Quote" }].map((n, i) => (
              <li key={n.href} style={{ animationDelay: `${i * 30}ms` }} className="motion-safe:animate-[fade-up_.45s_var(--ease-apple)_both]">
                <Link href={n.href} onClick={() => setOpen(false)} className="block py-2 text-[1.75rem] font-semibold tracking-[-0.03em] text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/design" onClick={() => setOpen(false)} className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-olive text-[1.0625rem] font-medium text-white">
            Design your door
          </Link>
        </nav>
      </div>
    </>
  );
}
