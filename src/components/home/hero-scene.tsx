"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { defaultConfig } from "@/domain/config";
import { HERO_OPEN_RENDER, HERO_RENDER, HERO_RENDER_PORTRAIT } from "@/content/assets";
import { DoorCanvas } from "@/components/three/door-canvas";
import { LinkButton } from "@/components/ui/button";

const HERO_DOOR = defaultConfig("pivot");
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Pinned, scroll-driven opening scene. As the visitor scrolls, the headline
 * lifts away, the door swings open and light from the room beyond spills out.
 * Pre-rendered stills show immediately (and remain if WebGL or motion is off);
 * the live 3D canvas fades in over them once ready.
 */
export function HeroScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const [live, setLive] = useState<"pending" | "on" | "off">("pending");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = sectionRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const travel = r.height - window.innerHeight;
        setP(travel > 0 ? clamp(-r.top / travel) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const open = ease(clamp((p - 0.12) / 0.5));
  const dolly = ease(clamp((p - 0.3) / 0.6)) * 0.55;
  const headline = 1 - clamp(p / 0.22);
  const second = clamp((p - 0.55) / 0.2) * (1 - clamp((p - 0.92) / 0.08));

  return (
    <section ref={sectionRef} aria-labelledby="hero-title" className={`on-dark relative bg-night text-white ${reduced ? "" : "h-[260svh]"}`}>
      <div className={`${reduced ? "relative" : "sticky top-0"} h-[100svh] overflow-hidden`}>
        {/* Stills: closed, then open as you scroll (also the no-WebGL experience). */}
        <div aria-hidden={live === "on"} className="absolute inset-0">
          <Image src={HERO_RENDER.src} alt={HERO_RENDER.alt} fill preload sizes="(min-width: 768px) 100vw, 1px" className="object-cover max-md:hidden" />
          <Image src={HERO_RENDER_PORTRAIT.src} alt={HERO_RENDER_PORTRAIT.alt} fill preload sizes="(max-width: 767px) 100vw, 1px" className="object-cover md:hidden" />
          <Image src={HERO_OPEN_RENDER.src} alt="" fill sizes="100vw" className="object-cover transition-opacity duration-300" style={{ opacity: live === "on" ? 0 : open }} />
        </div>
        {!reduced && live !== "off" && (
          <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: live === "on" ? 1 : 0 }}>
            <DoorCanvas
              config={HERO_DOOR}
              mode="hero"
              open={open}
              openInstant
              dolly={dolly}
              lazy={false}
              label="A walnut pivot door that opens as you scroll, with warm light beyond."
              onReady={(ok) => setLive(ok ? "on" : "off")}
            />
          </div>
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-night/70 to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-night/80 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1100px] flex-col items-center px-6 pt-[9svh] text-center" style={{ opacity: headline, transform: `translateY(${-(1 - headline) * 40}px)` }}>
          <p className="eyebrow-accent !text-brass-light">Threshold</p>
          <h1 id="hero-title" className="font-display mt-2 max-w-[16ch] text-[clamp(2.6rem,5.6vw,5rem)] leading-[1.04]">
            An entrance worth coming home to.
          </h1>
          <p className="mt-5 max-w-[34ch] text-lede text-white/80">Thoughtfully crafted doors, made to belong to your space.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/doors" variant="light" size="lg">
              Explore the collection
            </LinkButton>
            <LinkButton href="/design" variant="outline-light" size="lg">
              Design your door
            </LinkButton>
          </div>
        </div>

        <div aria-hidden={second < 0.05} className="pointer-events-none absolute inset-x-0 top-[12svh] z-10 px-6 text-center" style={{ opacity: second, transform: `translateY(${(1 - second) * 24}px)` }}>
          <p className="font-display mx-auto max-w-[20ch] text-display-m">Made to measure. Fitted by hand.</p>
          <p className="mx-auto mt-3 max-w-[40ch] text-lede text-white/75">Every Threshold door is built to your opening, in the timber, finish and hardware you choose.</p>
        </div>

        {!reduced && (
          <div aria-hidden="true" className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-xs tracking-wide text-white/50" style={{ opacity: headline }}>
            Scroll to open
          </div>
        )}
      </div>
    </section>
  );
}
