"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuoteStore } from "@/state/quote-store";
import { useHydrated } from "@/state/hydration";
import { buttonClass } from "@/components/ui/button";
import { Wordmark } from "./wordmark";

const NAV = [
  { href: "/doors", label: "Explore doors" },
  { href: "/#collections", label: "Collections" },
  { href: "/#materials", label: "Materials" },
  { href: "/#approach", label: "Our approach" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const doors = useQuoteStore((s) => s.items.reduce((a, i) => a + i.config.qty, 0));
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the menu when the route changes.
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

  const quoteLabel = hydrated && doors > 0 ? `Quote (${doors})` : "Quote";

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/88 backdrop-blur-md supports-[backdrop-filter]:bg-ivory/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 sm:px-6 lg:h-[72px] lg:px-10">
        <Link href="/" className="mr-auto shrink-0" aria-label="Threshold, home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-[0.94rem]">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={`py-2 text-ink-soft transition-colors hover:text-ink ${pathname === n.href ? "text-ink" : ""}`}
                  aria-current={pathname === n.href ? "page" : undefined}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/quote"
          className="tabular text-[0.94rem] text-ink-soft transition-colors hover:text-ink"
          aria-label={hydrated && doors > 0 ? `Your quote, ${doors} door${doors === 1 ? "" : "s"}` : "Your quote"}
        >
          {quoteLabel}
        </Link>
        <Link href="/design" className={buttonClass("primary", "sm", "hidden sm:inline-flex")}>
          Design your door
        </Link>
        <button
          ref={menuButton}
          type="button"
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true" className="relative block h-3 w-5">
            <span className={`absolute left-0 h-px w-5 bg-ink transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 h-px w-5 bg-ink transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        ref={panel}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-ivory lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <nav aria-label="Mobile" className="flex min-h-full flex-col justify-between px-6 pb-10 pt-8">
          <ul className="flex flex-col">
            {[...NAV, { href: "/visualise", label: "See it in your space" }, { href: "/quote", label: quoteLabel }].map((n) => (
              <li key={n.href} className="border-b border-line">
                <Link href={n.href} onClick={() => setOpen(false)} className="font-display block py-4 text-[2rem] leading-tight">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/design" onClick={() => setOpen(false)} className={buttonClass("primary", "lg", "mt-10 w-full")}>
            Design your door
          </Link>
        </nav>
      </div>
    </header>
  );
}
