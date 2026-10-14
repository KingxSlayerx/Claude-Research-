import { describe, expect, it } from "vitest";
import { adviceFor, applyChange, clampDimension, defaultConfig, normalizeConfig } from "@/domain/config";
import { summarize } from "@/domain/summary";

describe("configuration rules", () => {
  it("switching style resets to its defaults but keeps quantity, handing and a suitable room", () => {
    const c = { ...defaultConfig("flush"), qty: 4, swing: "L" as const, room: "utility" as const, color: "lam-grey" };
    const next = applyChange(c, { key: "style", value: "shaker" });
    expect(next).toMatchObject({ style: "shaker", qty: 4, swing: "L", room: "utility", finish: "pu", color: "pu-sage" });
    const main = applyChange(c, { key: "style", value: "main" });
    expect(main.room).toBe("main"); // Carved Main does not suit a utility room
  });

  it("switching finish keeps a valid colour", () => {
    const c = defaultConfig("flush");
    expect(applyChange(c, { key: "finish", value: "pu" }).color).toBe("pu-white");
  });

  it("rounds and clamps dimensions like the original", () => {
    expect(clampDimension("w", 873, 900)).toBe(870);
    expect(clampDimension("w", 5000, 900)).toBe(1500);
    expect(clampDimension("h", 100, 2100)).toBe(1800);
    expect(clampDimension("h", NaN, 2100)).toBe(2100);
    expect(applyChange(defaultConfig("flush"), { key: "qty", value: 500 }).qty).toBe(99);
    expect(applyChange(defaultConfig("flush"), { key: "qty", value: 0 }).qty).toBe(1);
  });

  it("gives the original advice for bathrooms and entrances", () => {
    const bath = { ...defaultConfig("flush"), room: "bath" as const };
    expect(adviceFor(bath).map((a) => a.id)).toEqual(["bath-core"]);
    const entrance = { ...defaultConfig("panel4"), room: "main" as const, lock: "tubular" as const };
    expect(adviceFor(entrance).map((a) => a.id)).toEqual(["main-thickness", "main-lock"]);
  });

  it("summarises like the original", () => {
    expect(summarize(defaultConfig("glass"))).toBe(
      "Glass Strip · 900×2100 mm · 35 mm · Engineered wood (HDF) · Laminate Oak grain · Fluted glass · Lever on rose (Matte black) · Key lock · Sal wood frame · RH inward",
    );
  });
});

describe("normalizeConfig (untrusted input)", () => {
  it("rejects unknown styles", () => {
    expect(normalizeConfig({ style: "garage" })).toBeNull();
    expect(normalizeConfig(null)).toBeNull();
    expect(normalizeConfig("panel4")).toBeNull();
  });

  it("repairs invalid fields from the style defaults", () => {
    const c = normalizeConfig({ style: "pivot", w: "99999", h: -1, finish: "gold", color: "<script>", lock: "laser", qty: 1e9, thick: "45", arch: "yes" })!;
    expect(c).toMatchObject({ w: 1500, h: 1800, finish: "veneer", color: "ven-walnut", lock: "smart", qty: 99, thick: 45, arch: false });
  });

  it("round-trips a valid configuration unchanged", () => {
    const c = { ...defaultConfig("barn"), qty: 3, swing: "L" as const };
    expect(normalizeConfig(JSON.parse(JSON.stringify(c)))).toEqual(c);
  });
});
