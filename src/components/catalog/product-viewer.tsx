"use client";

import Image from "next/image";
import { useState } from "react";
import { getStyle, type StyleId } from "@/domain/catalog";
import { defaultConfig } from "@/domain/config";
import { DoorCanvas } from "@/components/three/door-canvas";

/** Interactive 3D view of a design in its standard specification. Falls back to the still render. */
export function ProductViewer({ styleId, poster }: { styleId: StyleId; poster: string }) {
  const [live, setLive] = useState<"pending" | "on" | "off">("pending");
  const [open, setOpen] = useState(false);
  const cfg = defaultConfig(styleId);
  const name = getStyle(styleId).name;
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-tile)] bg-night-soft sm:aspect-[16/10]">
        <Image src={poster} alt="" fill sizes="(min-width: 1240px) 1240px, 100vw" className={`object-cover transition-opacity duration-700 ${live === "on" ? "opacity-0" : "opacity-100"}`} />
        {live !== "off" && (
          <div className={`absolute inset-0 transition-opacity duration-700 ${live === "on" ? "opacity-100" : "opacity-0"}`}>
            <DoorCanvas config={cfg} mode="studio" orbit open={open ? 1 : 0} label={`${name} door, standard specification. Drag to rotate.`} onReady={(ok) => setLive(ok ? "on" : "off")} />
          </div>
        )}
      </div>
      {live === "on" && (
        <div className="mt-6 flex justify-center">
          <div role="group" aria-label="Door position" className="inline-flex rounded-full bg-white/10 p-1 text-sm">
            {[
              { v: false, l: "Closed" },
              { v: true, l: cfg.style === "barn" ? "Slid open" : "Open" },
            ].map((o) => (
              <button
                key={o.l}
                type="button"
                aria-pressed={open === o.v}
                onClick={() => setOpen(o.v)}
                className={`rounded-full px-5 py-1.5 transition-colors ${open === o.v ? "bg-white text-ink" : "text-white/75 hover:text-white"}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
