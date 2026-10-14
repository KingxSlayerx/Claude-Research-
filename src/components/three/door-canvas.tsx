"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DoorConfig } from "@/domain/config";
import type { DoorStage, StageMode, ViewOverride } from "@/render3d/stage";

export interface DoorCanvasProps {
  config: DoorConfig;
  mode: StageMode;
  /** 0 closed … 1 open. */
  open?: number;
  /** Instant open changes (driven by scroll) instead of easing. */
  openInstant?: boolean;
  dolly?: number;
  orbit?: boolean;
  view?: ViewOverride | null;
  className?: string;
  /** Accessible description of what the canvas shows. */
  label: string;
  /** Called once the first frame is on screen, or with false if WebGL is unavailable. */
  onReady?: (ok: boolean) => void;
  /** Create the WebGL context only once the canvas is near the viewport. */
  lazy?: boolean;
}

/**
 * Live 3D door. three.js and the stage are loaded on demand, so pages that
 * never show a canvas never download them. Renders only when something changes.
 */
export function DoorCanvas({ config, mode, open = 0, openInstant = false, dolly = 0, orbit = false, view = null, className = "", label, onReady, lazy = true }: DoorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<DoorStage | null>(null);
  const [near, setNear] = useState(!lazy);
  const latest = useRef({ config, open, openInstant, dolly, view });
  const readyCb = useRef(onReady);
  useLayoutEffect(() => {
    latest.current = { config, open, openInstant, dolly, view };
    readyCb.current = onReady;
  });

  useEffect(() => {
    if (near) return;
    const el = canvasRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    (async () => {
      const mod = await import("@/render3d/stage");
      if (cancelled || !canvasRef.current) return;
      if (!mod.webglAvailable()) {
        readyCb.current?.(false);
        return;
      }
      try {
        const st = mod.createStage(canvasRef.current, { mode, orbit, pixelRatio: Math.min(window.devicePixelRatio, mode === "hero" ? 1.75 : 2) });
        stageRef.current = st;
        st.resize();
        const l = latest.current;
        st.setConfig(l.config);
        if (l.view) st.setView(l.view);
        st.setOpen(l.open, true);
        st.setDolly(l.dolly);
        st.render();
        ro = new ResizeObserver(() => st.resize());
        ro.observe(canvasRef.current);
        // Re-measure after the first layout pass so framing never uses a zero-sized canvas.
        requestAnimationFrame(() => {
          st.resize();
          readyCb.current?.(true);
        });
      } catch {
        readyCb.current?.(false);
      }
    })();
    return () => {
      cancelled = true;
      ro?.disconnect();
      stageRef.current?.dispose();
      stageRef.current = null;
    };
  }, [near, mode, orbit]);

  const cfgKey = JSON.stringify(config);
  useEffect(() => {
    stageRef.current?.setConfig(latest.current.config);
  }, [cfgKey]);
  useEffect(() => {
    stageRef.current?.setOpen(open, openInstant);
  }, [open, openInstant]);
  useEffect(() => {
    stageRef.current?.setDolly(dolly);
  }, [dolly]);
  const viewKey = JSON.stringify(view);
  useEffect(() => {
    stageRef.current?.setView(latest.current.view);
  }, [viewKey]);

  return <canvas ref={canvasRef} role="img" aria-label={label} className={`block h-full w-full ${orbit ? "cursor-grab touch-pan-y active:cursor-grabbing" : ""} ${className}`} />;
}
