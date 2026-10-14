"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STYLES, findStyle, getStyle, type StyleId } from "@/domain/catalog";
import { colourOf, defaultConfig, type DoorConfig } from "@/domain/config";
import { renderDoorSvg } from "@/render/door-svg";
import { SAMPLE_ROOMS } from "@/content/assets";
import { useQuoteStore } from "@/state/quote-store";
import { useHydrated } from "@/state/hydration";
import { DoorArt } from "@/components/ui/door-art";
import { Button, LinkButton } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { loadImage, MAX_UPLOAD_BYTES, OverlayCompositor, preparePhoto, type Placement } from "@/lib/visualiser/compositor";

/** Real-world geometry of the generated sample rooms (mm), so doors appear at true scale. */
const ROOM_GEOMETRY: Record<string, { w: number; h: number; floor: number; centreX: number }> = {
  hallway: { w: 4800, h: 3600, floor: 3050, centreX: 2400 },
  entrance: { w: 5600, h: 4200, floor: 3600, centreX: 2800 },
};

type Scene = { kind: "sample"; id: string } | { kind: "photo"; url: string; width: number; height: number };
type Upload = { state: "idle" } | { state: "loading" } | { state: "error"; message: string };

const DEFAULT_PHOTO_PLACEMENT: Placement = { x: 50, y: 55, h: 60 };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function samplePlacement(roomId: string, door: DoorConfig): Placement {
  const g = ROOM_GEOMETRY[roomId];
  const [, , , vh] = renderDoorSvg(door, { mode: "bare" }).viewBox;
  return { x: (g.centreX / g.w) * 100, y: ((g.floor - vh / 2) / g.h) * 100, h: (vh / g.h) * 100 };
}

export function Visualiser() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const draft = useQuoteStore((s) => s.draft);
  const items = useQuoteStore((s) => s.items);

  const initialPick = params.get("style") && findStyle(params.get("style")!) ? `style:${params.get("style")}` : "draft";
  const [pick, setPick] = useState<string>(initialPick);
  const [scene, setScene] = useState<Scene>({ kind: "sample", id: SAMPLE_ROOMS[0].id });
  const [upload, setUpload] = useState<Upload>({ state: "idle" });
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [exporting, setExporting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stageSize, setStageSize] = useState({ w: 1, h: 1 });

  const door: DoorConfig = useMemo(() => {
    if (pick.startsWith("style:")) return defaultConfig(pick.slice(6) as StyleId);
    if (pick.startsWith("item:")) return items.find((i) => i.id === pick.slice(5))?.config ?? draft;
    return draft;
  }, [pick, items, draft]);
  const aspect = useMemo(() => {
    const [, , w, h] = renderDoorSvg(door, { mode: "bare" }).viewBox;
    return w / h;
  }, [door]);

  const defaultPlacement = useCallback(
    (s: Scene = scene) => (s.kind === "sample" ? samplePlacement(s.id, door) : DEFAULT_PHOTO_PLACEMENT),
    [scene, door],
  );
  const place = placement ?? defaultPlacement();

  // Revoke the previous photo URL whenever it changes or the page closes.
  useEffect(() => {
    if (scene.kind !== "photo") return;
    const url = scene.url;
    return () => URL.revokeObjectURL(url);
  }, [scene]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUpload({ state: "loading" });
    try {
      const photo = await preparePhoto(file);
      const next: Scene = { kind: "photo", ...photo };
      setScene(next);
      setPlacement(null);
      setUpload({ state: "idle" });
    } catch (e) {
      setUpload({ state: "error", message: (e as Error).message });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const chooseSample = (id: string) => {
    setScene({ kind: "sample", id });
    setPlacement(null);
    setUpload({ state: "idle" });
  };

  /* ---------- pointer interaction: drag to move, pinch or corner-drag to resize ---------- */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ start: Placement; startDist?: number; startX: number; startY: number; mode: "move" | "resize" } | null>(null);

  const onPointerDown = (e: React.PointerEvent, mode: "move" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    gesture.current = {
      start: { ...place },
      startX: e.clientX,
      startY: e.clientY,
      mode,
      startDist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : undefined,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!gesture.current || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && g.startDist) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setPlacement({ ...g.start, h: clamp(g.start.h * (d / g.startDist), 8, 140) });
      return;
    }
    const dx = ((e.clientX - g.startX) / stageSize.w) * 100;
    const dy = ((e.clientY - g.startY) / stageSize.h) * 100;
    if (g.mode === "move") setPlacement({ ...g.start, x: clamp(g.start.x + dx, 0, 100), y: clamp(g.start.y + dy, 0, 100) });
    else {
      // Resize from the bottom-right corner, keeping the top-left fixed.
      const h = clamp(g.start.h + dy, 8, 140);
      const top = g.start.y - g.start.h / 2;
      const wPct = (hp: number) => (hp * aspect * stageSize.h) / stageSize.w;
      const left = g.start.x - wPct(g.start.h) / 2;
      setPlacement({ x: left + wPct(h) / 2, y: top + h / 2, h });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
    else {
      const p = [...pointers.current.values()][0];
      gesture.current = { start: { ...place }, startX: p.x, startY: p.y, mode: "move" };
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    const p = { ...place };
    if (e.key === "ArrowLeft") p.x -= step;
    else if (e.key === "ArrowRight") p.x += step;
    else if (e.key === "ArrowUp") p.y -= step;
    else if (e.key === "ArrowDown") p.y += step;
    else if (e.key === "+" || e.key === "=") p.h += step;
    else if (e.key === "-" || e.key === "_") p.h -= step;
    else return;
    e.preventDefault();
    setPlacement({ x: clamp(p.x, 0, 100), y: clamp(p.y, 0, 100), h: clamp(p.h, 8, 140) });
  };

  const download = async () => {
    setExporting(true);
    try {
      const src = scene.kind === "photo" ? scene.url : SAMPLE_ROOMS.find((r) => r.id === scene.id)!.image.src;
      const img = await loadImage(src);
      const blob = await OverlayCompositor.render({ image: img, door, placement: place });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `threshold-${door.style}-preview.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setUpload({ state: "error", message: "We couldn't create the image. You can take a screenshot instead." });
    } finally {
      setExporting(false);
    }
  };

  const sample = scene.kind === "sample" ? SAMPLE_ROOMS.find((r) => r.id === scene.id)! : null;
  const [natW, natH] = scene.kind === "photo" ? [scene.width, scene.height] : [sample!.image.width, sample!.image.height];
  const stageAspect = `${natW} / ${natH}`;
  const boxW = (place.h * aspect * stageSize.h) / stageSize.w;
  const s = getStyle(door.style);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-8">
        <div
          ref={stageRef}
          className="relative mx-auto touch-none select-none overflow-hidden bg-stone"
          style={{ aspectRatio: stageAspect, width: `min(100%, calc(78svh * ${natW / natH}))` }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- object URLs and local samples are shown as-is */}
          <img
            src={scene.kind === "photo" ? scene.url : sample!.image.src}
            alt={scene.kind === "photo" ? "Your photo" : sample!.image.alt}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          {hydrated && (
            <div
              role="application"
              aria-roledescription="movable door"
              aria-label={`${s.name} door in ${colourOf(door).label}. Drag to move. Arrow keys move, plus and minus resize.`}
              tabIndex={0}
              onKeyDown={onKey}
              onPointerDown={(e) => onPointerDown(e, "move")}
              className="group absolute cursor-grab outline-none active:cursor-grabbing"
              style={{ left: `${place.x - boxW / 2}%`, top: `${place.y - place.h / 2}%`, width: `${boxW}%`, height: `${place.h}%` }}
            >
              <DoorArt config={door} mode="bare" decorative className="h-full w-full drop-shadow-[0_10px_14px_rgba(0,0,0,.3)]" />
              <span aria-hidden="true" className="pointer-events-none absolute -inset-1 border border-dashed border-paper/0 group-hover:border-paper/80 group-focus-visible:border-paper" />
              <span
                aria-hidden="true"
                onPointerDown={(e) => onPointerDown(e, "resize")}
                className="absolute -bottom-3 -right-3 h-7 w-7 cursor-nwse-resize rounded-full border-2 border-paper bg-ink/80 shadow"
              />
            </div>
          )}
          {upload.state === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-paper" role="status">
              Preparing your photo…
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">
          {scene.kind === "sample"
            ? "Sample room shown at true scale for the door's size. Drag the door, or use the corner handle to resize."
            : "Drag the door into your doorway. Pinch or use the corner handle to resize; arrow keys work too."}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:col-span-4">
        <section aria-labelledby="photo-title" className="flex flex-col gap-3">
          <h2 id="photo-title" className="text-sm font-medium">
            1. Your doorway
          </h2>
          <input
            ref={fileRef}
            id="viz-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
            aria-describedby="viz-privacy"
          />
          <label htmlFor="viz-file" className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-paper hover:bg-ink-soft [:focus-visible+&]:outline-2 [:focus-visible+&]:outline-offset-2 [:focus-visible+&]:outline-olive">
            {scene.kind === "photo" ? "Choose another photo" : "Upload a photo"}
          </label>
          <p id="viz-privacy" className="text-xs leading-relaxed text-muted">
            Your photo is prepared in this browser and isn&rsquo;t uploaded or saved anywhere. It&rsquo;s gone when you leave the page. Max {MAX_UPLOAD_BYTES / 1024 / 1024} MB.
            Shoot straight on, from about chest height.
          </p>
          {upload.state === "error" && (
            <p role="alert" className="border-l-2 border-error bg-error-soft px-3 py-2 text-sm">
              {upload.message}
            </p>
          )}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sample rooms">
            {SAMPLE_ROOMS.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={scene.kind === "sample" && scene.id === r.id}
                onClick={() => chooseSample(r.id)}
                className="rounded-full border border-line-strong px-4 py-1.5 text-sm aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="door-title" className="flex flex-col gap-3">
          <h2 id="door-title" className="text-sm font-medium">
            2. Door to place
          </h2>
          <label htmlFor="viz-door" className="sr-only">
            Door to place
          </label>
          <Select
            id="viz-door"
            value={pick}
            onChange={(e) => {
              setPick(e.target.value);
              if (scene.kind === "sample") setPlacement(null);
            }}
          >
            <option value="draft">Your current design · {hydrated ? getStyle(draft.style).name : "…"}</option>
            {items.length > 0 && (
              <optgroup label="In your quote">
                {items.map((it, i) => (
                  <option key={it.id} value={`item:${it.id}`}>
                    Quote item {i + 1} · {getStyle(it.config.style).name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Collection (standard specification)">
              {STYLES.map((st) => (
                <option key={st.id} value={`style:${st.id}`}>
                  {st.name}
                </option>
              ))}
            </optgroup>
          </Select>
        </section>

        <section aria-labelledby="size-title" className="flex flex-col gap-3">
          <h2 id="size-title" className="text-sm font-medium">
            3. Adjust
          </h2>
          <label htmlFor="viz-size" className="flex justify-between text-sm text-ink-soft">
            Door height in the picture <span className="tabular">{Math.round(place.h)}%</span>
          </label>
          <input
            id="viz-size"
            type="range"
            min={8}
            max={140}
            step={0.5}
            value={place.h}
            onChange={(e) => setPlacement({ ...place, h: Number(e.target.value) })}
            className="w-full accent-[var(--color-olive)]"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPlacement(null)}>
              Reset position
            </Button>
            <Button variant="secondary" size="sm" onClick={download} disabled={exporting || !hydrated}>
              {exporting ? "Preparing…" : "Save image"}
            </Button>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-line pt-6">
          <LinkButton href={pick.startsWith("style:") ? `/design?style=${door.style}` : "/design"}>Change this design</LinkButton>
          <p className="text-xs leading-relaxed text-muted">
            This places an illustration of your configuration over the photo to help judge colour and proportion. It isn&rsquo;t a photographic render, and lighting and perspective in your room will differ.
          </p>
        </div>
      </div>
    </div>
  );
}
