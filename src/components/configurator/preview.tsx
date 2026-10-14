"use client";

import { useState } from "react";
import type { DoorConfig } from "@/domain/config";
import { summarize } from "@/domain/summary";
import { DoorArt } from "@/components/ui/door-art";
import { DoorCanvas } from "@/components/three/door-canvas";

type View = "3d" | "drawing";

/**
 * Live preview: an interactive 3D door (drag to rotate, open/close) with a
 * dimensioned elevation drawing as the alternative view. The drawing is also
 * the fallback when WebGL isn't available.
 */
export function ConfiguratorPreview({ config, ready }: { config: DoorConfig; ready: boolean }) {
  const [view, setView] = useState<View>("3d");
  const [webgl, setWebgl] = useState<"pending" | "on" | "off">("pending");
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const show3d = view === "3d" && webgl !== "off";

  return (
    <div className="flex flex-col gap-3">
      <div data-webgl={webgl} className="tile relative aspect-[4/5] w-full !bg-[#f2efea] sm:aspect-[4/3] lg:aspect-auto lg:h-[calc(100svh-236px)] lg:min-h-[440px]">
        {!ready && <div className="absolute inset-0 animate-pulse bg-stone" aria-hidden="true" />}
        {ready && (
          <>
            <div className={`absolute inset-0 transition-opacity duration-500 ${show3d && webgl === "on" ? "opacity-100" : "pointer-events-none opacity-0"}`}>
              {view === "3d" && webgl !== "off" && (
                <DoorCanvas
                  key={resetKey}
                  config={config}
                  mode="studio"
                  orbit
                  open={open ? 1 : 0}
                  lazy={false}
                  label={`3D preview: ${summarize(config)}. Drag to rotate.`}
                  onReady={(ok) => setWebgl(ok ? "on" : "off")}
                />
              )}
            </div>
            {(!show3d || webgl !== "on") && (
              <div className="absolute inset-0 p-2">
                <DoorArt config={config} dims={view === "drawing"} className="h-full w-full" label={`Preview: ${summarize(config)}`} />
              </div>
            )}
          </>
        )}
        {show3d && webgl === "on" && <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs text-muted backdrop-blur">Drag to turn</p>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div role="group" aria-label="Preview" className="inline-flex rounded-full bg-stone p-1 text-[0.82rem]">
          {(
            [
              ["3d", "3D"],
              ["drawing", "Drawing with dimensions"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              disabled={v === "3d" && webgl === "off"}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 transition-colors disabled:opacity-40 ${view === v ? "bg-white text-ink shadow-soft" : "text-muted hover:text-ink"}`}
            >
              {l}
            </button>
          ))}
        </div>
        {show3d && webgl === "on" && (
          <>
            <button type="button" aria-pressed={open} onClick={() => setOpen((o) => !o)} className="rounded-full bg-stone px-4 py-2 text-[0.82rem] text-ink hover:bg-sand">
              {open ? "Close the door" : config.style === "barn" ? "Slide it open" : "Open the door"}
            </button>
            <button type="button" onClick={() => setResetKey((k) => k + 1)} className="rounded-full px-3 py-2 text-[0.82rem] text-olive hover:underline">
              Reset view
            </button>
          </>
        )}
      </div>
    </div>
  );
}
