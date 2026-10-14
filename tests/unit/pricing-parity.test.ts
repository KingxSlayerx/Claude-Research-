import { describe, expect, it } from "vitest";
import {
  CORES, FINISHES, FRAMES, GLASSES, HANDLES, HARDWARE_FINISHES, LOCKS, ROOMS, STYLES, THICKNESSES,
} from "@/domain/catalog";
import { defaultConfig, type DoorConfig } from "@/domain/config";
import { priceDoor, quoteTotals, startingPrice } from "@/domain/pricing";
import { summarize } from "@/domain/summary";
import { loadLegacy } from "./legacy";

const legacy = loadLegacy();

/** Deterministic PRNG so failures are reproducible. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];

function randomConfig(r: () => number): DoorConfig {
  const style = pick(r, STYLES).id;
  const finish = pick(r, FINISHES);
  return {
    ...defaultConfig(style),
    room: pick(r, ROOMS).id,
    w: 600 + Math.floor(r() * 91) * 10,
    h: 1800 + Math.floor(r() * 121) * 10,
    thick: pick(r, THICKNESSES).id,
    core: pick(r, CORES).id,
    finish: finish.id,
    color: pick(r, finish.colors).id,
    glass: pick(r, GLASSES).id,
    handle: pick(r, HANDLES).id,
    hw: pick(r, HARDWARE_FINISHES).id,
    lock: pick(r, LOCKS).id,
    frame: pick(r, FRAMES).id,
    arch: r() > 0.5,
    hinge: r() > 0.5 ? "concealed" : "standard",
    swing: r() > 0.5 ? "L" : "R",
    open: r() > 0.5 ? "in" : "out",
    install: r() > 0.3,
    qty: 1 + Math.floor(r() * 12),
  };
}

describe("pricing parity with the original site", () => {
  it("defaults match for every style", () => {
    for (const s of STYLES) {
      expect(defaultConfig(s.id)).toEqual(legacy.defaultCfg(s.id));
      expect(startingPrice(s)).toBe(legacy.fromPrice({ id: s.id }));
    }
  });

  it("matches line-by-line for 5,000 random configurations", () => {
    const r = rng(20241014);
    for (let i = 0; i < 5000; i++) {
      const c = randomConfig(r);
      const mine = priceDoor(c);
      const theirs = legacy.price({ ...c });
      expect(mine.unit).toBe(theirs.unit);
      expect(mine.lines.map((l) => [l.label, l.amount])).toEqual(theirs.lines);
      expect(summarize(c)).toBe(legacy.summary({ ...c }));
    }
  });

  it("matches quote totals including GST and quantities", () => {
    const r = rng(7);
    for (let i = 0; i < 300; i++) {
      const cfgs = Array.from({ length: 1 + Math.floor(r() * 6) }, () => randomConfig(r));
      const mine = quoteTotals(cfgs);
      const theirs = legacy.totals(cfgs.map((cfg) => ({ cfg: { ...cfg } })));
      expect(mine.subtotal).toBe(theirs.sub);
      expect(mine.gst).toBe(theirs.gst);
      expect(mine.total).toBe(theirs.total);
      expect(mine.doors).toBe(theirs.doors);
      const catSum = Object.values(mine.byCategory).reduce((a, b) => a + b, 0);
      expect(catSum).toBe(mine.subtotal);
    }
  });
});
