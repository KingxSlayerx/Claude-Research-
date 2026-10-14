/**
 * Estimate pricing. Pure functions only — no UI, no persistence.
 * Behaviour is identical to the original `price`, `fromPrice` and `totals`
 * functions (verified by tests/unit/pricing-parity.test.ts). The only
 * addition is a `category` on each line, used to present product,
 * hardware, frame and installation costs separately.
 */
import {
  BUSINESS_RULES,
  getCore,
  getFinish,
  getFrame,
  getGlass,
  getHandle,
  getHardwareFinish,
  getLock,
  getStyle,
  getThickness,
  type DoorStyle,
} from "./catalog";
import { defaultConfig, type DoorConfig } from "./config";

export type LineCategory = "product" | "hardware" | "frame" | "installation";

export interface PriceLine {
  key: string;
  label: string;
  amount: number;
  category: LineCategory;
}

export interface DoorEstimate {
  lines: PriceLine[];
  /** Estimate for one door, before GST. */
  unit: number;
  /** Shutter area in square feet. */
  area: number;
}

export const CATEGORY_LABELS: Record<LineCategory, string> = {
  product: "Door & glass",
  hardware: "Handles, locks & fittings",
  frame: "Frame & trim",
  installation: "Installation",
};

const SQ_MM_PER_SQ_FT = 92903.04;
const r10 = (n: number) => Math.round(n / 10) * 10;

export function priceDoor(c: DoorConfig): DoorEstimate {
  const s = getStyle(c.style);
  const area = (c.w * c.h) / SQ_MM_PER_SQ_FT;
  const core = getCore(c.core);
  const finish = getFinish(c.finish);
  const L: PriceLine[] = [];

  L.push({
    key: "shutter",
    label: `${s.name} shutter · ${area.toFixed(1)} sq ft · ${core.label.toLowerCase()} · ${finish.label.toLowerCase()}`,
    amount: r10(s.rate * area * core.mult * finish.mult * getThickness(c.thick).mult),
    category: "product",
  });

  if (s.glass) {
    const g = getGlass(c.glass);
    L.push({ key: "glass", label: `${g.label} glass panel`, amount: g.price, category: "product" });
  }

  const h = getHandle(c.handle);
  const hw = getHardwareFinish(c.hw);
  const longPull = c.style === "pivot" && c.handle === "pull";
  L.push({
    key: "handle",
    label: `${h.label}${longPull ? ", 1400 mm" : ""}, ${hw.label.toLowerCase()}`,
    amount: r10(h.price * (longPull ? BUSINESS_RULES.pivotPullMultiplier : 1) + hw.price),
    category: "hardware",
  });

  if (c.lock !== "none") {
    const lock = getLock(c.lock);
    L.push({ key: "lock", label: lock.label, amount: lock.price, category: "hardware" });
  }

  if (s.special) L.push({ key: "special", label: s.special.label, amount: s.special.price, category: "hardware" });
  else if (c.hinge === "concealed")
    L.push({ key: "hinges", label: "Concealed 3D hinges", amount: BUSINESS_RULES.concealedHinges, category: "hardware" });
  else L.push({ key: "hinges", label: "3 SS ball-bearing hinges", amount: 0, category: "hardware" });

  if (!s.noFrame && c.frame !== "none") {
    const f = getFrame(c.frame);
    L.push({ key: "frame", label: f.label, amount: f.price, category: "frame" });
  }
  if (!s.noFrame && c.arch)
    L.push({ key: "architrave", label: "Architrave, both faces", amount: BUSINESS_RULES.architrave, category: "frame" });

  if (c.install)
    L.push({ key: "install", label: "Fitting & installation", amount: s.install ?? BUSINESS_RULES.install, category: "installation" });

  return { lines: L, unit: L.reduce((a, l) => a + l.amount, 0), area };
}

/** "From" price: the style's default configuration (incl. its default frame and installation), before GST. */
export function startingPrice(s: DoorStyle): number {
  return priceDoor(defaultConfig(s.id)).unit;
}

export interface QuoteTotals {
  doors: number;
  /** Before GST. */
  subtotal: number;
  gst: number;
  total: number;
  byCategory: Record<LineCategory, number>;
}

export function quoteTotals(configs: DoorConfig[]): QuoteTotals {
  const byCategory: Record<LineCategory, number> = { product: 0, hardware: 0, frame: 0, installation: 0 };
  let subtotal = 0;
  let doors = 0;
  for (const c of configs) {
    const est = priceDoor(c);
    subtotal += est.unit * c.qty;
    doors += c.qty;
    for (const l of est.lines) byCategory[l.category] += l.amount * c.qty;
  }
  const gst = Math.round(subtotal * BUSINESS_RULES.gstRate);
  return { doors, subtotal, gst, total: subtotal + gst, byCategory };
}
