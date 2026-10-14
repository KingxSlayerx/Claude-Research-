/**
 * Loads the pricing functions from the original single-file site so the new
 * implementation can be compared against them. Only the data and pricing
 * section of the legacy script is evaluated, in an isolated VM context.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export interface LegacyApi {
  price(c: Record<string, unknown>): { lines: [string, number][]; unit: number; area: number };
  fromPrice(s: { id: string }): number;
  totals(items: { cfg: Record<string, unknown> }[]): { sub: number; gst: number; total: number; doors: number };
  defaultCfg(id: string): Record<string, unknown>;
  summary(c: Record<string, unknown>): string;
  STYLES: { id: string }[];
}

export function loadLegacy(): LegacyApi {
  const html = fs.readFileSync(path.join(__dirname, "../../legacy/Threshold Door Studio.html"), "utf8");
  const start = html.indexOf("/* ============ CONFIG");
  const end = html.indexOf("/* ============ door drawing");
  if (start < 0 || end < 0) throw new Error("Legacy script markers not found");
  const src = html.slice(start, end) + "\n;({price,fromPrice,totals,defaultCfg,summary,STYLES})";
  const ctx = vm.createContext({ localStorage: undefined, document: undefined, Math, String, Number, JSON });
  return vm.runInContext(src, ctx) as LegacyApi;
}
