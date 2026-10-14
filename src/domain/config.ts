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
  STYLES,
  THICKNESSES,
  getFinish,
  getStyle,
  type Colour,
  type CoreId,
  type FinishId,
  type FrameId,
  type GlassId,
  type HandleId,
  type HardwareFinishId,
  type HingeId,
  type LockId,
  type RoomId,
  type StyleId,
  type Thickness,
} from "./catalog";

export type Swing = "L" | "R";
export type Opening = "in" | "out";

/** A complete, valid configuration of one door line. Units: millimetres. */
export interface DoorConfig {
  style: StyleId;
  room: RoomId;
  w: number;
  h: number;
  thick: Thickness;
  core: CoreId;
  finish: FinishId;
  color: string;
  glass: GlassId;
  handle: HandleId;
  hw: HardwareFinishId;
  lock: LockId;
  frame: FrameId;
  arch: boolean;
  hinge: HingeId;
  swing: Swing;
  open: Opening;
  install: boolean;
  qty: number;
}

/** Mirrors the original `defaultCfg`. */
export function defaultConfig(styleId: StyleId): DoorConfig {
  const s = getStyle(styleId);
  return {
    style: styleId,
    w: 900,
    h: 2100,
    thick: 35,
    core: "engineered",
    finish: "laminate",
    color: "lam-ivory",
    glass: "frosted",
    handle: "lever",
    hw: "steel",
    lock: "tubular",
    frame: "sal",
    arch: false,
    hinge: "standard",
    swing: "R",
    open: "in",
    qty: 1,
    install: true,
    room: s.rooms[0],
    ...s.def,
  };
}

export function colourOf(c: Pick<DoorConfig, "finish" | "color">): Colour {
  const f = getFinish(c.finish);
  return f.colors.find((x) => x.id === c.color) ?? f.colors[0];
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Mirrors the original number-input handler: round to 10 mm and clamp. */
export function clampDimension(kind: "w" | "h", value: number, fallback: number): number {
  const lim = kind === "w" ? BUSINESS_RULES.width : BUSINESS_RULES.height;
  const v = Math.round((Number.isFinite(value) && value ? value : fallback) / 10) * 10;
  return clamp(v, lim.min, lim.max);
}

export function clampQty(q: number): number {
  return clamp(Math.round(Number.isFinite(q) ? q : 1), BUSINESS_RULES.qty.min, BUSINESS_RULES.qty.max);
}

export type ConfigChange =
  | { key: "style"; value: StyleId }
  | { key: "size"; value: { w: number; h: number } }
  | { key: "w" | "h"; value: number }
  | { key: "finish"; value: FinishId }
  | { key: "thick"; value: Thickness }
  | { key: "room"; value: RoomId }
  | { key: "core"; value: CoreId }
  | { key: "color"; value: string }
  | { key: "glass"; value: GlassId }
  | { key: "handle"; value: HandleId }
  | { key: "hw"; value: HardwareFinishId }
  | { key: "lock"; value: LockId }
  | { key: "frame"; value: FrameId }
  | { key: "hinge"; value: HingeId }
  | { key: "swing"; value: Swing }
  | { key: "open"; value: Opening }
  | { key: "arch" | "install"; value: boolean }
  | { key: "qty"; value: number };

/**
 * Applies one customer change. Pure — returns a new config.
 * Rules mirror the original `setCfg`:
 *  - Changing style resets to that style's defaults, keeping quantity and handing,
 *    and keeping the chosen room if the new style suits it.
 *  - Changing finish keeps the colour if it belongs to the new finish, else picks the first.
 */
export function applyChange(c: DoorConfig, change: ConfigChange): DoorConfig {
  switch (change.key) {
    case "style": {
      const nc = defaultConfig(change.value);
      if (getStyle(change.value).rooms.includes(c.room)) nc.room = c.room;
      return { ...nc, qty: c.qty, swing: c.swing };
    }
    case "size":
      return { ...c, w: change.value.w, h: change.value.h };
    case "w":
    case "h":
      return { ...c, [change.key]: clampDimension(change.key, change.value, c[change.key]) };
    case "finish": {
      const f = getFinish(change.value);
      return { ...c, finish: change.value, color: f.colors.some((x) => x.id === c.color) ? c.color : f.colors[0].id };
    }
    case "qty":
      return { ...c, qty: clampQty(change.value) };
    default:
      return { ...c, [change.key]: change.value } as DoorConfig;
  }
}

/* ---------- validation of untrusted input (server and persisted client state) ---------- */

function oneOf<T extends string | number>(allowed: readonly T[], v: unknown, fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

/**
 * Converts untrusted input (localStorage, API payloads) into a valid DoorConfig.
 * Returns null when the style is unknown — a door cannot be priced without one.
 * Every other invalid field falls back to the style default, so totals are always computable.
 */
export function normalizeConfig(input: unknown): DoorConfig | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const style = STYLES.find((s) => s.id === raw.style);
  if (!style) return null;
  const d = defaultConfig(style.id);
  const finish = oneOf(FINISHES.map((f) => f.id), raw.finish, d.finish);
  const colours = getFinish(finish).colors.map((x) => x.id);
  const color = oneOf(colours, raw.color, colours.includes(d.color) ? d.color : colours[0]);
  const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);
  const bool = (v: unknown, fb: boolean) => (typeof v === "boolean" ? v : fb);
  return {
    style: style.id,
    room: oneOf(ROOMS.map((r) => r.id), raw.room, d.room),
    w: clampDimension("w", num(raw.w), d.w),
    h: clampDimension("h", num(raw.h), d.h),
    thick: oneOf(THICKNESSES.map((t) => t.id), num(raw.thick) as Thickness, d.thick),
    core: oneOf(CORES.map((x) => x.id), raw.core, d.core),
    finish,
    color,
    glass: oneOf(GLASSES.map((x) => x.id), raw.glass, d.glass),
    handle: oneOf(HANDLES.map((x) => x.id), raw.handle, d.handle),
    hw: oneOf(HARDWARE_FINISHES.map((x) => x.id), raw.hw, d.hw),
    lock: oneOf(LOCKS.map((x) => x.id), raw.lock, d.lock),
    frame: oneOf(FRAMES.map((x) => x.id), raw.frame, d.frame),
    arch: bool(raw.arch, d.arch),
    hinge: oneOf(HINGES.map((x) => x.id), raw.hinge, d.hinge),
    swing: oneOf<Swing>(["L", "R"], raw.swing, d.swing),
    open: oneOf<Opening>(["in", "out"], raw.open, d.open),
    install: bool(raw.install, d.install),
    qty: clampQty(num(raw.qty)),
  };
}

/* ---------- guidance (mirrors the original advice banners) ---------- */

export interface Advice {
  id: "bath-core" | "main-thickness" | "main-lock";
  step: "core" | "hardware";
  title: string;
  message: string;
  action: { label: string; change: ConfigChange };
}

export function adviceFor(c: DoorConfig): Advice[] {
  const out: Advice[] = [];
  if (c.room === "bath" && c.core !== "wpc")
    out.push({
      id: "bath-core",
      step: "core",
      title: "Bathroom door",
      message: "Wood cores can swell with moisture. WPC won't.",
      action: { label: "Switch to WPC", change: { key: "core", value: "wpc" } },
    });
  if (c.room === "main" && c.thick < 40)
    out.push({
      id: "main-thickness",
      step: "core",
      title: "Entrance door",
      message: "40 mm or thicker is standard for security.",
      action: { label: "Make it 40 mm", change: { key: "thick", value: 40 } },
    });
  if (c.room === "main" && (c.lock === "tubular" || c.lock === "privacy" || c.lock === "none"))
    out.push({
      id: "main-lock",
      step: "hardware",
      title: "Entrance door",
      message: "A mortise or smart lock is recommended.",
      action: { label: "Use mortise lock", change: { key: "lock", value: "mortise" } },
    });
  return out;
}
