import { describe, expect, it } from "vitest";
import { STYLES, getStyle } from "@/domain/catalog";
import { defaultConfig, type DoorConfig } from "@/domain/config";
import { priceDoor, quoteTotals, startingPrice } from "@/domain/pricing";
import { inr } from "@/domain/format";

const cfg = (over: Partial<DoorConfig> & Pick<DoorConfig, "style">): DoorConfig => ({ ...defaultConfig(over.style), ...over });

describe("representative estimates (values from the original rate card)", () => {
  it("prices the standard Four-Panel door", () => {
    const e = priceDoor(defaultConfig("panel4"));
    // 900×2100 = 20.34 sq ft × ₹900 × sal 1.4 × veneer 1.3 × 35 mm 1.08, rounded to ₹10
    expect(e.lines.find((l) => l.key === "shutter")!.amount).toBe(35990);
    expect(e.unit).toBe(46890);
  });

  it("prices the Pivot Entrance with its long pull, pivot set and installation", () => {
    const e = priceDoor(defaultConfig("pivot"));
    expect(e.lines.find((l) => l.key === "handle")).toMatchObject({ amount: 7190, label: "Pull bar, 1400 mm, matte black" });
    expect(e.lines.find((l) => l.key === "special")!.amount).toBe(18000);
    expect(e.lines.find((l) => l.key === "install")!.amount).toBe(4500);
    expect(e.lines.some((l) => l.key === "frame")).toBe(false);
    expect(e.unit).toBe(164680);
  });

  it("adds glass only to glass styles", () => {
    expect(priceDoor(cfg({ style: "glass", glass: "smoked" })).lines.find((l) => l.key === "glass")!.amount).toBe(3200);
    expect(priceDoor(cfg({ style: "flush", glass: "smoked" })).lines.some((l) => l.key === "glass")).toBe(false);
  });

  it("ignores frame, architrave and hinge choices on frameless styles", () => {
    const barn = priceDoor(cfg({ style: "barn", frame: "teak", arch: true, hinge: "concealed" }));
    expect(barn.lines.map((l) => l.key)).not.toContain("frame");
    expect(barn.lines.map((l) => l.key)).not.toContain("architrave");
    expect(barn.lines.find((l) => l.key === "special")!.label).toBe("Top track & roller kit");
  });

  it("charges concealed hinges, architrave and removes installation when unticked", () => {
    const base = priceDoor(defaultConfig("flush")).unit;
    expect(priceDoor(cfg({ style: "flush", hinge: "concealed" })).unit - base).toBe(3400);
    expect(priceDoor(cfg({ style: "flush", arch: true })).unit - base).toBe(2600);
    expect(base - priceDoor(cfg({ style: "flush", install: false })).unit).toBe(1800);
  });

  it("starting prices are the default configuration", () => {
    for (const s of STYLES) expect(startingPrice(s)).toBe(priceDoor(defaultConfig(s.id)).unit);
    expect(startingPrice(getStyle("flush"))).toBe(17290);
  });
});

describe("quote totals", () => {
  it("multiplies by quantity and applies 18% GST to the subtotal", () => {
    const t = quoteTotals([cfg({ style: "pivot", qty: 2 }), cfg({ style: "flush", qty: 3 })]);
    expect(t.doors).toBe(5);
    expect(t.subtotal).toBe(164680 * 2 + 17290 * 3);
    expect(t.gst).toBe(Math.round(t.subtotal * 0.18));
    expect(t.total).toBe(t.subtotal + t.gst);
    expect(Object.values(t.byCategory).reduce((a, b) => a + b, 0)).toBe(t.subtotal);
  });

  it("is zero for an empty quote", () => {
    expect(quoteTotals([])).toMatchObject({ doors: 0, subtotal: 0, gst: 0, total: 0 });
  });
});

describe("Indian currency formatting", () => {
  it("uses lakh grouping", () => {
    expect(inr(164680)).toBe("₹1,64,680");
    expect(inr(12345678)).toBe("₹1,23,45,678");
    expect(inr(950.4)).toBe("₹950");
  });
});
