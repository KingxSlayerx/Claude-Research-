"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUSINESS_RULES,
  CORES,
  FINISHES,
  FRAMES,
  GLASSES,
  HANDLES,
  HARDWARE_FINISHES,
  HINGES,
  LOCKS,
  ROOMS,
  SIZE_PRESETS,
  STYLES,
  THICKNESSES,
  findStyle,
  getFinish,
  getStyle,
  type StyleId,
} from "@/domain/catalog";
import { adviceFor, colourOf, type ConfigChange } from "@/domain/config";
import { priceDoor, startingPrice } from "@/domain/pricing";
import { specRows } from "@/domain/summary";
import { feetInches, inr } from "@/domain/format";
import { useQuoteStore } from "@/state/quote-store";
import { useHydrated } from "@/state/hydration";
import { ConfiguratorPreview } from "./preview";
import Image from "next/image";
import { PRODUCT_RENDERS } from "@/content/assets";
import { Button, ArrowIcon } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PriceBreakdown } from "@/components/quote/price-breakdown";
import { AdviceNote, OptionGroup, QtyStepper, SwatchGroup, Toggle } from "./options";
import { DimensionInput } from "./dimension-input";

const pct = (m: number) => (m === 1 ? "Base" : `${m > 1 ? "+" : "−"}${Math.round(Math.abs(m - 1) * 100)}%`);

export function Configurator() {
  const hydrated = useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const draft = useQuoteStore((s) => s.draft);
  const editingId = useQuoteStore((s) => s.editingId);
  const items = useQuoteStore((s) => s.items);
  const change = useQuoteStore((s) => s.change);
  const commitDraft = useQuoteStore((s) => s.commitDraft);
  const cancelEdit = useQuoteStore((s) => s.cancelEdit);
  const startDesign = useQuoteStore((s) => s.startDesign);
  const editItem = useQuoteStore((s) => s.editItem);
  const handled = useRef(false);

  // Apply ?style= or ?edit= once persisted state has loaded, then clean the URL.
  useEffect(() => {
    if (!hydrated || handled.current) return;
    handled.current = true;
    const style = params.get("style");
    const edit = params.get("edit");
    const room = params.get("room") ?? undefined;
    if (edit) {
      if (!editItem(edit)) toast("That quote item no longer exists.");
    } else if (style && findStyle(style)) {
      startDesign(style as StyleId, room);
    }
    if (style || edit) router.replace("/design", { scroll: false });
  }, [hydrated, params, editItem, startDesign, router]);

  const s = getStyle(draft.style);
  const est = useMemo(() => priceDoor(draft), [draft]);
  const advice = adviceFor(draft);
  const editing = editingId !== null && items.some((i) => i.id === editingId);
  const set = (c: ConfigChange) => change(c);
  const finish = getFinish(draft.finish);

  const add = () => {
    const { updated } = commitDraft();
    if (updated) {
      toast("Quote item updated");
      router.push("/quote");
    } else {
      toast(`Added ${draft.qty} × ${s.name} to your quote`, { label: "View quote", onClick: () => router.push("/quote") });
    }
  };

  const steps = [
    { id: "style", label: "Style" },
    { id: "size", label: "Size" },
    { id: "core", label: "Core" },
    { id: "finish", label: "Finish" },
    ...(s.glass ? [{ id: "glass", label: "Glass" }] : []),
    { id: "hardware", label: "Hardware" },
    { id: "fitting", label: "Frame & fitting" },
    { id: "review", label: "Review" },
  ];
  const active = useActiveStep(steps.map((x) => x.id));
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  const addLabel = editing ? "Save changes" : "Add to quote";

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-32 sm:px-6 lg:px-10 lg:pb-24">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Preview */}
        <div className="lg:col-span-7">
          <div className="flex flex-col gap-4 pt-8 lg:sticky lg:top-12 lg:pt-8">
            <div>
              <p className="eyebrow-accent">{editing ? "Editing a door in your quote" : "Design your door"}</p>
              <h1 className="font-display mt-1 text-[clamp(2rem,3.4vw,3rem)] leading-tight">{s.name}</h1>
            </div>
            <ConfiguratorPreview config={draft} ready={hydrated} />
            <div className="hidden items-center justify-between gap-6 lg:flex">
              <p className="tabular">
                <span className="block text-xs text-muted">Estimate per door, before GST</span>
                <span className="font-display text-[2rem] leading-none" data-testid="unit-price">
                  {inr(est.unit)}
                </span>
              </p>
              <div className="flex items-center gap-3">
                <QtyStepper value={draft.qty} onChange={(v) => set({ key: "qty", value: v })} />
                <Button size="lg" onClick={add} disabled={!hydrated}>
                  {addLabel}
                </Button>
              </div>
            </div>
            <p className="hidden text-xs text-muted lg:block">
              A 3D visualisation of your configuration. Colours on screen are a guide; we bring physical samples to your site measurement.
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="lg:col-span-5">
          {editing && (
            <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl bg-olive-soft px-5 py-3 text-sm">
              <span>You&rsquo;re editing a door in your quote.</span>
              <button type="button" className="underline underline-offset-4" onClick={() => cancelEdit()}>
                Add as a new door instead
              </button>
            </div>
          )}
          <nav aria-label="Configuration steps" className="sticky top-12 z-20 -mx-4 mt-4 border-b border-line bg-ivory/90 px-4 backdrop-blur-xl lg:mx-0 lg:px-0">
            <ol className="flex gap-1 overflow-x-auto py-3 [scrollbar-width:none]">
              {steps.map((st, i) => (
                <li key={st.id} className="shrink-0">
                  <a
                    href={`#step-${st.id}`}
                    aria-current={active === st.id ? "step" : undefined}
                    className={`block rounded-full px-3 py-1.5 text-[0.82rem] transition-colors ${active === st.id ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
                  >
                    <span className="tabular mr-1 text-xs opacity-60">{i + 1}</span>
                    {st.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col" aria-label="Door options">
            <Step id="style" n={num()} title="Room & style">
              <OptionGroup
                legend="Where is this door going?"
                name="room"
                columns={3}
                value={draft.room}
                onChange={(v) => set({ key: "room", value: v })}
                options={ROOMS.map((r) => ({ value: r.id, label: r.label }))}
              />
              <fieldset className="flex min-w-0 flex-col gap-3">
                <legend className="mb-3 text-sm font-medium">Style</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {STYLES.map((st) => (
                    <label key={st.id} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="style"
                        className="peer sr-only"
                        checked={draft.style === st.id}
                        onChange={() => set({ key: "style", value: st.id })}
                      />
                      <span className="flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-paper transition-[border-color,box-shadow] hover:border-line-strong peer-checked:border-olive peer-checked:shadow-[inset_0_0_0_1px_var(--color-olive)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive">
                        <span className="relative block aspect-[4/5] bg-stone">
                          <Image src={PRODUCT_RENDERS[st.id].src} alt="" fill sizes="160px" className="object-cover" />
                        </span>
                        <span className="flex flex-col px-3 py-2.5">
                          <span className="text-[0.92rem]">{st.name}</span>
                          <span className="tabular text-xs text-muted">from {inr(startingPrice(st))}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="text-sm text-muted">{s.blurb} Changing style resets the options to that design&rsquo;s standard specification.</p>
            </Step>

            <Step id="size" n={num()} title="Size">
              <OptionGroup
                legend="Common sizes"
                name="size"
                columns={3}
                value={`${draft.w}x${draft.h}`}
                onChange={(v) => {
                  const [w, h] = String(v).split("x").map(Number);
                  set({ key: "size", value: { w, h } });
                }}
                options={SIZE_PRESETS.map((z) => ({ value: `${z.w}x${z.h}`, label: z.label, hint: `${z.w} × ${z.h} mm` }))}
              />
              <div className="flex gap-3">
                <DimensionInput kind="w" value={draft.w} onCommit={(v) => set({ key: "w", value: v })} />
                <DimensionInput kind="h" value={draft.h} onCommit={(v) => set({ key: "h", value: v })} />
              </div>
              <p className="text-sm text-muted">
                Not sure? Pick the closest size — we measure every opening before production. {feetInches(draft.w)} × {feetInches(draft.h)}, {est.area.toFixed(1)} sq ft of shutter.
              </p>
            </Step>

            <Step id="core" n={num()} title="Core & thickness">
              <OptionGroup
                legend="Core material"
                name="core"
                columns={1}
                value={draft.core}
                onChange={(v) => set({ key: "core", value: v })}
                options={CORES.map((c) => ({ value: c.id, label: c.label, hint: c.note, detail: pct(c.mult) }))}
              />
              <OptionGroup
                legend="Shutter thickness"
                name="thick"
                columns={3}
                value={draft.thick}
                onChange={(v) => set({ key: "thick", value: v })}
                options={THICKNESSES.map((t) => ({ value: t.id, label: t.label, detail: pct(t.mult) }))}
              />
              {advice
                .filter((a) => a.step === "core")
                .map((a) => (
                  <AdviceNote key={a.id} title={a.title} message={a.message} actionLabel={a.action.label} onAction={() => set(a.action.change)} />
                ))}
            </Step>

            <Step id="finish" n={num()} title="Finish & colour">
              <OptionGroup
                legend="Finish"
                name="finish"
                columns={2}
                value={draft.finish}
                onChange={(v) => set({ key: "finish", value: v })}
                options={FINISHES.map((f) => ({ value: f.id, label: f.label, hint: f.note, detail: pct(f.mult) }))}
              />
              <SwatchGroup
                legend="Colour"
                name="color"
                value={draft.color}
                onChange={(v) => set({ key: "color", value: v })}
                swatches={finish.colors.map((c) => ({ value: c.id, label: c.label, hex: c.hex, grain: c.grain }))}
              />
            </Step>

            {s.glass && (
              <Step id="glass" n={num()} title="Glass">
                <OptionGroup
                  legend="Glass panel"
                  name="glass"
                  columns={2}
                  value={draft.glass}
                  onChange={(v) => set({ key: "glass", value: v })}
                  options={GLASSES.map((g) => ({ value: g.id, label: g.label, detail: `+${inr(g.price)}` }))}
                />
              </Step>
            )}

            <Step id="hardware" n={num()} title="Handle & lock">
              <OptionGroup
                legend="Handle"
                name="handle"
                columns={2}
                value={draft.handle}
                onChange={(v) => set({ key: "handle", value: v })}
                options={HANDLES.map((h) => ({
                  value: h.id,
                  label: h.label,
                  detail: inr(h.price * (draft.style === "pivot" && h.id === "pull" ? BUSINESS_RULES.pivotPullMultiplier : 1)),
                  hint: draft.style === "pivot" && h.id === "pull" ? "1400 mm bar for pivot doors" : undefined,
                }))}
              />
              <SwatchGroup
                legend="Hardware finish"
                name="hw"
                value={draft.hw}
                onChange={(v) => set({ key: "hw", value: v as typeof draft.hw })}
                swatches={HARDWARE_FINISHES.map((h) => ({ value: h.id, label: h.label, hex: h.hex, detail: h.price ? `+${inr(h.price)}` : "Included" }))}
              />
              <OptionGroup
                legend="Lock"
                name="lock"
                columns={2}
                value={draft.lock}
                onChange={(v) => set({ key: "lock", value: v })}
                options={LOCKS.map((l) => ({ value: l.id, label: l.label, detail: l.price ? inr(l.price) : "—" }))}
              />
              {advice
                .filter((a) => a.step === "hardware")
                .map((a) => (
                  <AdviceNote key={a.id} title={a.title} message={a.message} actionLabel={a.action.label} onAction={() => set(a.action.change)} />
                ))}
            </Step>

            <Step id="fitting" n={num()} title="Frame & fitting">
              {s.noFrame ? (
                <p className="border border-line bg-paper px-4 py-3 text-[0.95rem] text-ink-soft">
                  {s.name} doors don&rsquo;t use a conventional frame. The {s.special!.label.toLowerCase()} is included at{" "}
                  <span className="tabular text-ink">{inr(s.special!.price)}</span>.
                </p>
              ) : (
                <>
                  <OptionGroup
                    legend="Frame"
                    name="frame"
                    columns={2}
                    value={draft.frame}
                    onChange={(v) => set({ key: "frame", value: v })}
                    options={FRAMES.map((f) => ({ value: f.id, label: f.label, detail: f.price ? inr(f.price) : undefined, hint: f.price ? undefined : "Use your existing frame" }))}
                  />
                  <Toggle checked={draft.arch} onChange={(v) => set({ key: "arch", value: v })} label="Architrave moulding on both faces" detail={inr(BUSINESS_RULES.architrave)} />
                  <OptionGroup
                    legend="Hinges"
                    name="hinge"
                    columns={2}
                    value={draft.hinge}
                    onChange={(v) => set({ key: "hinge", value: v })}
                    options={HINGES.map((h) => ({ value: h.id, label: h.label, detail: h.id === "standard" ? "Included" : `+${inr(BUSINESS_RULES.concealedHinges)}` }))}
                  />
                </>
              )}
              <OptionGroup
                legend="Handing (standing on the side it opens toward)"
                name="swing"
                columns={2}
                value={draft.swing}
                onChange={(v) => set({ key: "swing", value: v })}
                options={[
                  { value: "L", label: "Left hand" },
                  { value: "R", label: "Right hand" },
                ]}
              />
              {draft.style !== "barn" && (
                <OptionGroup
                  legend="Opening direction"
                  name="open"
                  columns={2}
                  value={draft.open}
                  onChange={(v) => set({ key: "open", value: v })}
                  options={[
                    { value: "in", label: "Opens inward" },
                    { value: "out", label: "Opens outward" },
                  ]}
                />
              )}
              <Toggle
                checked={draft.install}
                onChange={(v) => set({ key: "install", value: v })}
                label="Fitting & installation by our team"
                detail={`${inr(s.install ?? BUSINESS_RULES.install)} per door`}
              />
            </Step>

            <Step id="review" n={num()} title="Review">
              <dl className="grid grid-cols-[7.5rem_1fr] border-t border-line text-[0.92rem]">
                {specRows(draft).map((r) => (
                  <div key={r.label} className="col-span-2 grid grid-cols-subgrid border-b border-line py-2">
                    <dt className="text-muted">{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-[20px] bg-stone p-6">
                <h3 className="eyebrow mb-4">Estimate per door</h3>
                <PriceBreakdown estimate={est} />
                <div className="mt-5 flex items-baseline justify-between border-t border-ink pt-3">
                  <span className="font-semibold">Per door, before GST</span>
                  <span className="tabular font-display text-[1.9rem] leading-none">{inr(est.unit)}</span>
                </div>
                {draft.qty > 1 && (
                  <p className="tabular mt-2 text-right text-sm text-ink-soft">
                    {draft.qty} doors · {inr(est.unit * draft.qty)} before GST
                  </p>
                )}
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Estimate only, excluding GST ({Math.round(BUSINESS_RULES.gstRate * 100)}% is added on your quote). Your final price is confirmed after a site measurement and may change with the opening size and wall condition.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <QtyStepper value={draft.qty} onChange={(v) => set({ key: "qty", value: v })} />
                <Button size="lg" onClick={add} disabled={!hydrated}>
                  {addLabel} <ArrowIcon />
                </Button>
                <Link href={`/visualise`} className="link-underline ml-1 text-sm">
                  See it in your space
                </Link>
              </div>
            </Step>
          </form>
        </div>
      </div>

      {/* Mobile price bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <p className="tabular min-w-0">
            <span className="block whitespace-nowrap text-[0.7rem] text-muted">
              {draft.qty > 1 ? `${draft.qty} doors · before GST` : "Per door · before GST"}
            </span>
            <span className="font-display text-[1.7rem] leading-none" data-testid="mobile-price">
              {inr(est.unit * draft.qty)}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <QtyStepper size="sm" value={draft.qty} onChange={(v) => set({ key: "qty", value: v })} />
            <Button onClick={add} disabled={!hydrated} size="md" className="!px-4">
              {editing ? "Save" : "Add to quote"}
            </Button>
          </div>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {hydrated ? `${s.name}, ${colourOf(draft).label}. Estimate ${inr(est.unit)} per door.` : ""}
      </span>
    </div>
  );
}

const STEP_PROMPTS: Record<string, string> = {
  style: "Which one is right for you?",
  size: "Made to your opening.",
  core: "What's inside matters.",
  finish: "Choose the surface you'll see every day.",
  glass: "How much light should pass?",
  hardware: "The part you'll touch most.",
  fitting: "How it hangs in your home.",
  review: "Check everything before you add it.",
};

function Step({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`step-${id}`} aria-labelledby={`step-${id}-title`} data-step={id} className="flex scroll-mt-28 flex-col gap-6 border-b border-line py-12 last:border-b-0">
      <h2 id={`step-${id}-title`} className="text-[1.6rem] font-semibold leading-tight tracking-[-0.025em]">
        <span className="sr-only">Step {Number(n)}: </span>
        {title}.{" "}
        <span className="text-muted">{STEP_PROMPTS[id]}</span>
      </h2>
      {children}
    </section>
  );
}

function useActiveStep(ids: string[]): string {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(",");
  useEffect(() => {
    const els = key.split(",").map((id) => document.getElementById(`step-${id}`)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive((vis[0].target as HTMLElement).dataset.step!);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [key]);
  return active;
}
