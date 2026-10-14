"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FINISHES, HARDWARE_FINISHES, type HardwareFinishId } from "@/domain/catalog";
import { applyChange, defaultConfig, type DoorConfig } from "@/domain/config";
import { priceDoor } from "@/domain/pricing";
import { inr } from "@/domain/format";
import { DoorArt } from "@/components/ui/door-art";
import { Button, ArrowIcon } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { useQuoteStore } from "@/state/quote-store";

/** A small, real slice of the configurator: finish, colour and hardware on the Shaker door. */
const TRY_COLOURS = [
  ...FINISHES.find((f) => f.id === "pu")!.colors.map((c) => ({ finish: "pu" as const, ...c })),
  ...FINISHES.find((f) => f.id === "veneer")!.colors.slice(0, 3).map((c) => ({ finish: "veneer" as const, ...c })),
];

export function MakeItYours() {
  const router = useRouter();
  const setDraft = useQuoteStore((s) => s.setDraft);
  const cancelEdit = useQuoteStore((s) => s.cancelEdit);
  const [cfg, setCfg] = useState<DoorConfig>(() => defaultConfig("shaker"));
  const est = priceDoor(cfg);

  const continueDesigning = () => {
    cancelEdit();
    setDraft(cfg);
    router.push("/design");
  };

  return (
    <section aria-labelledby="miy-title" className="bg-olive-deep py-24 text-paper lg:py-36">
      <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="flex flex-col gap-8 lg:col-span-5">
          <p className="eyebrow !text-paper/65">Make it yours</p>
          <h2 id="miy-title" className="font-display text-display-l">
            Change the colour. Watch the door change with it.
          </h2>
          <p className="max-w-[44ch] text-lg leading-relaxed text-paper/80">
            Our configurator lets you choose the size, core, finish, colour, glass, handle and lock — and shows the door and its estimate update as you go.
          </p>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm text-paper/70">Finish & colour</legend>
            <div className="flex flex-wrap gap-3">
              {TRY_COLOURS.map((c) => {
                const on = cfg.color === c.id;
                return (
                  <label key={c.id} className="group relative cursor-pointer" title={c.label}>
                    <input
                      type="radio"
                      name="miy-colour"
                      className="peer sr-only"
                      checked={on}
                      onChange={() => setCfg((p) => ({ ...applyChange(p, { key: "finish", value: c.finish }), color: c.id }))}
                    />
                    <span
                      className={`block h-11 w-11 rounded-full border border-white/25 ring-offset-2 ring-offset-olive-deep transition peer-focus-visible:ring-2 peer-focus-visible:ring-paper ${on ? "ring-2 ring-paper" : ""}`}
                      style={{ background: c.hex }}
                    />
                    <span className="sr-only">
                      {c.label} ({c.finish === "pu" ? "paint" : "veneer"})
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm text-paper/70">Hardware</legend>
            <div className="flex flex-wrap gap-2">
              {HARDWARE_FINISHES.map((h) => (
                <label key={h.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="miy-hw"
                    className="peer sr-only"
                    checked={cfg.hw === h.id}
                    onChange={() => setCfg((p) => applyChange(p, { key: "hw", value: h.id as HardwareFinishId }))}
                  />
                  <span className="flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm transition peer-checked:border-paper peer-checked:bg-paper peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-paper">
                    <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ background: h.hex }} />
                    {h.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Button onClick={continueDesigning} className="!bg-paper !text-ink hover:!bg-ivory" size="lg">
              Continue designing <ArrowIcon />
            </Button>
            <p className="tabular text-paper/80" aria-live="polite">
              Shaker, as shown: <span className="text-paper">{inr(est.unit)}</span>
              <span className="block text-xs text-paper/60">Estimate per door, before GST</span>
            </p>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="mx-auto aspect-[5/6] max-w-[560px] overflow-hidden bg-[#e8e0d2] shadow-lift">
            <DoorArt config={cfg} className="h-full w-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}
