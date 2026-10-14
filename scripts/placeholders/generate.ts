/**
 * Generates temporary placeholder imagery into public/images/placeholders.
 *
 *   npm run placeholders            # all shots
 *   npm run placeholders -- hero    # shots whose name contains "hero"
 *
 * Requires Chromium (Playwright). Set CHROMIUM_PATH if it is not at the
 * default location. Replace every output with real photography before
 * launch — see docs/ASSETS.md.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { defaultConfig, type DoorConfig } from "../../src/domain/config";
import type { StyleId } from "../../src/domain/catalog";
import { composeScene, materialStudy, type SceneOptions } from "./compose";

const OUT = path.join(__dirname, "../../public/images/placeholders");

const cfg = (id: StyleId, over: Partial<DoorConfig> = {}): DoorConfig => ({ ...defaultConfig(id), ...over });

interface Shot {
  name: string;
  px: [number, number];
  svg: () => string;
}

/** Portrait vignette with one door, sized to frame the door generously. */
function vignette(c: DoorConfig, o: Partial<SceneOptions> = {}): string {
  const width = Math.max(3600, c.w * 3.4);
  const height = width * 1.25;
  const floorY = height * 0.84;
  return composeScene({
    width,
    height,
    floorY,
    wall: "#e6ddd0",
    floor: "#b9a589",
    door: { cfg: c, x: width / 2 - c.w / 2 },
    light: "soft",
    ...o,
  });
}

const shots: Shot[] = [
  {
    name: "hero-entrance",
    px: [2400, 1500],
    svg: () =>
      composeScene({
        width: 6400,
        height: 4000,
        floorY: 3480,
        wall: "#d8ccb9",
        floor: "#77726a",
        stone: { x: 5650, w: 750, tone: "#a8957a" },
        door: { cfg: cfg("pivot", { color: "ven-walnut" }), x: 3900 },
        light: "jaali",
        jaaliX: 2600,
        props: [
          { kind: "sconce", x: 3350, y: 1500 },
          { kind: "plant", x: 5900, scale: 1.15, pot: "#2f2b27" },
        ],
        vignette: 0.42,
      }),
  },
  {
    name: "cta-dusk",
    px: [2400, 1350],
    svg: () =>
      composeScene({
        width: 7200,
        height: 4050,
        floorY: 3500,
        wall: "#cdbfa9",
        floor: "#6f6a62",
        stone: { x: 4900, w: 2300, tone: "#9d8a70" },
        door: { cfg: cfg("main"), x: 2600 },
        light: "dusk",
        props: [
          { kind: "sconce", x: 2050, y: 1500 },
          { kind: "sconce", x: 4250, y: 1500 },
          { kind: "plant", x: 1100, scale: 1.1, pot: "#2f2b27" },
          { kind: "step", x: 2100, w: 2500, h: 110, tone: "#5c5953" },
        ],
        vignette: 0.55,
      }),
  },
  // collections
  {
    name: "collection-entrance",
    px: [1200, 1500],
    svg: () =>
      vignette(cfg("main"), {
        wall: "#d9cdb9",
        floor: "#7e786e",
        stone: { x: 0, w: 900, tone: "#b3a084" },
        light: "jaali",
        props: [{ kind: "urli", x: 4300, tone: "#8a6a3a" }],
      }),
  },
  {
    name: "collection-panelled",
    px: [1200, 1500],
    svg: () =>
      vignette(cfg("panel4"), {
        wall: "#e4dccd",
        props: [
          { kind: "art", x: 300, y: 900, w: 700, h: 900, tone: "#a3533a" },
          { kind: "bench", x: 2350, w: 1100, tone: "#7a5534" },
          { kind: "vase", x: 3000, y: 3346, tone: "#ece6da" },
        ],
      }),
  },
  {
    name: "collection-contemporary",
    px: [1200, 1500],
    svg: () =>
      vignette(cfg("grooved", { color: "lam-oak" }), {
        wall: "#ebe6dc",
        floor: "#c9bba4",
        light: "window",
        props: [{ kind: "plant", x: 3050, scale: 0.9, pot: "#d9d2c3" }],
      }),
  },
  {
    name: "collection-light-air",
    px: [1200, 1500],
    svg: () =>
      vignette(cfg("glass"), {
        wall: "#e2dfd4",
        floor: "#bfb6a6",
        light: "window",
        props: [{ kind: "shelf", x: 2320, y: 1900, w: 1100 }],
      }),
  },
  {
    name: "collection-space-saving",
    px: [1200, 1500],
    svg: () =>
      vignette(cfg("barn"), {
        wall: "#e8e1d4",
        floor: "#a88d6c",
        props: [
          { kind: "window", x: 2500, y: 700, w: 900, h: 1300 },
          { kind: "plant", x: 2950, scale: 0.8, pot: "#3a3631" },
        ],
      }),
  },
  // materials
  {
    name: "material-wood",
    px: [1600, 1067],
    svg: () => materialStudy({ kind: "planks", grain: true, tones: ["#8a5a2e", "#58392a", "#c39b66", "#d3be98", "#6a4934", "#b98f5e"] }),
  },
  {
    name: "material-finishes",
    px: [1600, 1067],
    svg: () => materialStudy({ kind: "samples", grain: true, tones: ["#c39b66", "#e7e0d0", "#8a5a2e", "#9da09b", "#58392a", "#e4dac3"] }),
  },
  {
    name: "material-colours",
    px: [1600, 1067],
    svg: () => materialStudy({ kind: "samples", grain: false, tones: ["#f0efea", "#a3b19b", "#b4735a", "#28323c", "#1d1d1e", "#d3be98"] }),
  },
  {
    name: "material-hardware",
    px: [1600, 1067],
    svg: () => materialStudy({ kind: "hardware", grain: true, tones: ["#58392a"] }),
  },
  // visualiser sample rooms (openings without doors)
  {
    name: "sample-room-hallway",
    px: [1600, 1200],
    svg: () =>
      composeScene({
        width: 4800,
        height: 3600,
        floorY: 3050,
        wall: "#e6ddcf",
        floor: "#b9a589",
        opening: { x: 1950, w: 900, h: 2100 },
        light: "soft",
        props: [
          { kind: "art", x: 500, y: 1000, w: 650, h: 850, tone: "#6f7a5e" },
          { kind: "plant", x: 3900, scale: 0.85, pot: "#3a3631" },
        ],
      }),
  },
  {
    name: "sample-room-entrance",
    px: [1600, 1200],
    svg: () =>
      composeScene({
        width: 5600,
        height: 4200,
        floorY: 3600,
        wall: "#d8cbb6",
        floor: "#7e786e",
        stone: { x: 0, w: 1500, tone: "#b3a084" },
        opening: { x: 2300, w: 1000, h: 2400 },
        light: "jaali",
        props: [
          { kind: "sconce", x: 3850, y: 1700 },
          { kind: "plant", x: 4800, scale: 0.95, pot: "#a8714c" },
        ],
      }),
  },
  {
    name: "process-measure",
    px: [1600, 1067],
    svg: () =>
      composeScene({
        width: 4800,
        height: 3200,
        floorY: 2700,
        wall: "#e4dccd",
        floor: "#b9a589",
        opening: { x: 1900, w: 1000, h: 2100 },
        light: "window",
      }),
  },
];

// product images: one vignette per style
const productSettings: Record<StyleId, Partial<SceneOptions>> = {
  flush: { wall: "#e2ddd3", props: [{ kind: "art", x: 400, y: 900, w: 650, h: 850, tone: "#b4735a" }] },
  shaker: { wall: "#ece6db", floor: "#c4b294", light: "window", props: [{ kind: "bench", x: 2400, w: 1000, tone: "#9b7a55" }] },
  panel4: { wall: "#e4dccd", props: [{ kind: "vase", x: 3100, y: 3780, tone: "#ece6da" }] },
  grooved: { wall: "#efeae1", floor: "#cbbda6", light: "window", props: [{ kind: "plant", x: 3000, scale: 0.85, pot: "#d9d2c3" }] },
  glass: { wall: "#e2dfd4", floor: "#bfb6a6", props: [{ kind: "shelf", x: 2320, y: 1900, w: 1100 }] },
  louvre: { wall: "#e9e6de", floor: "#a9a59b", tiles: { y: 1900, tone: "#dfe3dc" } },
  main: { wall: "#d9cdb9", floor: "#7e786e", stone: { x: 0, w: 900, tone: "#b3a084" }, light: "jaali" },
  pivot: { wall: "#ddd2c1", floor: "#8f8a80", stone: { x: 0, w: 800, tone: "#b8a58a" }, light: "jaali", props: [{ kind: "sconce", x: 3350, y: 1900 }] },
  barn: { wall: "#e8e1d4", floor: "#a88d6c", props: [{ kind: "window", x: 2650, y: 800, w: 800, h: 1200 }] },
};
for (const [id, o] of Object.entries(productSettings) as [StyleId, Partial<SceneOptions>][]) {
  shots.push({ name: `door-${id}`, px: [1200, 1500], svg: () => vignette(cfg(id), o) });
}

/** Only the visualiser sample rooms are still used; other shots are kept for reference. */
const IN_USE = /^sample-room-/;

async function main() {
  const filter = process.argv[2];
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  });
  const page = await browser.newPage();
  for (const shot of shots) {
    if (!IN_USE.test(shot.name)) continue;
    if (filter && !shot.name.includes(filter)) continue;
    const [w, h] = shot.px;
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(
      `<html><body style="margin:0;overflow:hidden"><div style="width:${w}px;height:${h}px">${shot
        .svg()
        .replace("<svg ", '<svg width="100%" height="100%" ')}</div></body></html>`,
    );
    await page.waitForTimeout(150);
    const file = path.join(OUT, `${shot.name}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 84 });
    console.log(`✓ ${shot.name}.jpg (${Math.round(fs.statSync(file).size / 1024)} KB)`);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
