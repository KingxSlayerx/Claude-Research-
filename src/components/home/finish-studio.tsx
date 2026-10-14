"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FINISHES, HARDWARE_FINISHES, getFinish, getStyle, type FinishId, type HardwareFinishId, type StyleId } from "@/domain/catalog";
import { applyChange, colourOf, defaultConfig, type DoorConfig } from "@/domain/config";
import { priceDoor } from "@/domain/pricing";
import { inr } from "@/domain/format";
import { PRODUCT_RENDERS } from "@/content/assets";
import { useQuoteStore } from "@/state/quote-store";
import { DoorCanvas } from "@/components/three/door-canvas";
import { Button } from "@/components/ui/button";

const STYLE_CHOICES: StyleId[] = ["shaker", "panel4", "grooved", "flush"];

/** A real slice of the configurator: style, finish, colour and hardware on a live 3D door. */
export function FinishStudio() {
  const router = useRouter();
  const setDraft = useQuoteStore((s) => s.setDraft);
  const cancelEdit = useQuoteStore((s) => s.cancelEdit);
  const [cfg, setCfg] = useState<DoorConfig>(() => ({ ...defaultConfig("shaker"), finish: "veneer", color: "ven-walnut", hw: "brass" }));
  const [live, setLive] = useState<"pending" | "on" | "off">("pending");
  const finish = getFinish(cfg.finish);
  const colour = colourOf(cfg);
  const est = priceDoor(cfg);

  const pickStyle = (id: StyleId) =>
    setCfg((c) => {
      const next = applyChange(c, { key: "style", value: id });
      return { ...applyChange(next, { key: "finish", value: c.finish }), color: c.color, hw: c.hw };
    });

  return (
    <section aria-labelledby="studio-title" className="bg-ivory py-24 lg:py-32">
      <div className="mx-auto max-w-[1100px] px-6 text-center">
        <p className="eyebrow-accent">Make it yours</p>
        <h2 id="studio-title" className="font-display mt-2 text-display-l">
          Every finish, rendered live.
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-lede text-muted">Change the timber, colour and hardware and see the door change with it. Drag to turn it.</p>
      </div>

      <div className="mx-auto mt-12 max-w-[1240px] px-4 sm:px-6">
        <div className="tile relative aspect-[4/5] sm:aspect-[16/11]">
          <Image
            src={PRODUCT_RENDERS.shaker.src}
            alt=""
            fill
            sizes="(min-width: 1240px) 1240px, 100vw"
            className={`object-cover transition-opacity duration-700 ${live === "on" ? "opacity-0" : "opacity-100"}`}
          />
          {live !== "off" && (
            <div className={`absolute inset-0 transition-opacity duration-700 ${live === "on" ? "opacity-100" : "opacity-0"}`}>
              <DoorCanvas config={cfg} mode="studio" orbit label={`${getStyle(cfg.style).name} door in ${finish.label.toLowerCase()} ${colour.label}`} onReady={(ok) => setLive(ok ? "on" : "off")} />
            </div>
          )}
          {live === "on" && <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs text-muted backdrop-blur">Drag to turn</p>}
        </div>

        <div className="mx-auto mt-10 flex max-w-[880px] flex-col items-center gap-8">
          <div role="radiogroup" aria-label="Style" className="inline-flex rounded-full bg-stone p-1">
            {STYLE_CHOICES.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={cfg.style === id}
                onClick={() => pickStyle(id)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors sm:px-5 ${cfg.style === id ? "bg-white text-ink shadow-soft" : "text-muted hover:text-ink"}`}
              >
                {getStyle(id).name}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            <div role="radiogroup" aria-label="Finish" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[0.95rem]">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={cfg.finish === f.id}
                  onClick={() => setCfg((c) => applyChange(c, { key: "finish", value: f.id as FinishId }))}
                  className={`border-b-2 pb-1 transition-colors ${cfg.finish === f.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div role="radiogroup" aria-label="Colour" className="flex flex-wrap justify-center gap-3">
              {finish.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={cfg.color === c.id}
                  aria-label={c.label}
                  title={c.label}
                  onClick={() => setCfg((x) => ({ ...x, color: c.id }))}
                  className={`h-9 w-9 rounded-full border border-black/10 shadow-[inset_0_-4px_8px_rgba(0,0,0,.12)] ring-offset-2 ring-offset-ivory transition-shadow ${cfg.color === c.id ? "ring-2 ring-olive" : "hover:ring-1 hover:ring-line-strong"}`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
            <p className="text-sm text-muted" aria-live="polite">
              {finish.label} · {colour.label}
            </p>
          </div>

          <div role="radiogroup" aria-label="Hardware finish" className="flex flex-wrap justify-center gap-2">
            {HARDWARE_FINISHES.map((h) => (
              <button
                key={h.id}
                type="button"
                role="radio"
                aria-checked={cfg.hw === h.id}
                onClick={() => setCfg((c) => applyChange(c, { key: "hw", value: h.id as HardwareFinishId }))}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${cfg.hw === h.id ? "border-ink text-ink" : "border-line text-muted hover:border-line-strong"}`}
              >
                <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ background: h.hex }} />
                {h.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="tabular text-lede">
              {getStyle(cfg.style).name}, as shown <span className="font-semibold">{inr(est.unit)}</span>
              <span className="block text-sm text-muted">Estimate per door, before GST</span>
            </p>
            <Button
              size="lg"
              onClick={() => {
                cancelEdit();
                setDraft(cfg);
                router.push("/design");
              }}
            >
              Continue designing
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
