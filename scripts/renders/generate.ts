/**
 * Renders product imagery from the 3D door model into public/images/renders.
 *
 *   npm run renders              # everything
 *   npm run renders -- product   # names containing "product"
 *
 * These are computer-generated visualisations of the real configurations.
 * Replace with photography when available (docs/ASSETS.md).
 */
import fs from "node:fs";
import path from "node:path";
import { STYLES } from "../../src/domain/catalog";
import type { ViewOverride, StageMode } from "../../src/render3d/stage";
import { openRenderer } from "./harness";

const OUT = path.join(__dirname, "../../public/images/renders");

interface Shot {
  name: string;
  size: [number, number];
  cfg: Record<string, unknown> & { style: string };
  mode: StageMode;
  open?: number;
  view?: ViewOverride;
}

const shots: Shot[] = [
  { name: "hero-closed", size: [2400, 1350], cfg: { style: "pivot" }, mode: "hero" },
  { name: "hero-closed-portrait", size: [1080, 1700], cfg: { style: "pivot" }, mode: "hero" },
  { name: "hero-open", size: [2400, 1350], cfg: { style: "pivot" }, mode: "hero", open: 0.62 },
  ...STYLES.map((s) => ({ name: `product-${s.id}`, size: [1200, 1500] as [number, number], cfg: { style: s.id }, mode: "product" as const })),
  ...STYLES.map((s) => ({ name: `product-wide-${s.id}`, size: [1920, 1200] as [number, number], cfg: { style: s.id }, mode: "product" as const })),
  {
    name: "macro-panel",
    size: [1600, 1200],
    cfg: { style: "panel4" },
    mode: "product",
    view: { target: [0.27, 1.84, 0.03], distance: 0.62, azimuth: 0.62, elevation: 0.16, fov: 30 },
  },
  {
    name: "macro-hardware",
    size: [1600, 1200],
    cfg: { style: "panel4", color: "ven-walnut" },
    mode: "product",
    view: { target: [0.79, 0.93, 0.05], distance: 0.6, azimuth: -0.6, elevation: 0.12, fov: 30 },
  },
  {
    name: "macro-grain",
    size: [1600, 1200],
    cfg: { style: "grooved", finish: "veneer", color: "ven-oak" },
    mode: "product",
    view: { target: [0.45, 1.25, 0], distance: 0.9, azimuth: 0.45, elevation: 0.05, fov: 30 },
  },
  {
    name: "macro-louvre",
    size: [1600, 1200],
    cfg: { style: "louvre", finish: "pu", color: "pu-sage" },
    mode: "product",
    view: { target: [0.45, 1.55, 0], distance: 0.85, azimuth: 0.7, elevation: 0.2, fov: 30 },
  },
];

(async () => {
  const filter = process.argv[2];
  fs.mkdirSync(OUT, { recursive: true });
  const bySize = new Map<string, Shot[]>();
  for (const s of shots) {
    if (filter && !s.name.includes(filter)) continue;
    const k = s.size.join("x");
    bySize.set(k, [...(bySize.get(k) ?? []), s]);
  }
  for (const [, group] of bySize) {
    const [w, h] = group[0].size;
    const { page, close } = await openRenderer(w, h);
    for (const shot of group) {
      const t = Date.now();
      const url = await page.evaluate(
        ([c, o]) => window.threshold.render(c as never, o as never),
        [shot.cfg, { mode: shot.mode, open: shot.open, view: shot.view }] as const,
      );
      const file = path.join(OUT, `${shot.name}.jpg`);
      fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
      console.log(`✓ ${shot.name}.jpg ${Math.round(fs.statSync(file).size / 1024)} KB in ${((Date.now() - t) / 1000).toFixed(1)}s`);
    }
    await close();
  }
})();
