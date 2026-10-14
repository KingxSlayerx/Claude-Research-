/**
 * Physically based materials for the 3D door, generated procedurally so the
 * site ships without texture downloads. Textures are cached per colour.
 */
import * as THREE from "three";
import { getFinish, getGlass, getHardwareFinish, type FinishId, type GlassId, type HardwareFinishId } from "@/domain/catalog";
import type { DoorConfig } from "@/domain/config";
import { colourOf } from "@/domain/config";

const texCache = new Map<string, THREE.Texture>();

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255] as const;
}

/** Vertical wood grain: long fibres, growth-ring streaks and occasional cathedral arches. */
function woodCanvas(hex: string, seed: number, w = 512, h = 2048): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const [r, g, b] = hexToRgb(hex);
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, w, h);
  const rand = rng(seed);

  // broad tonal bands
  for (let i = 0; i < 14; i++) {
    const x = rand() * w;
    const bw = 20 + rand() * 90;
    const d = (rand() - 0.5) * 0.22;
    const grd = ctx.createLinearGradient(x - bw, 0, x + bw, 0);
    const col = d < 0 ? `rgba(0,0,0,${-d})` : `rgba(255,240,220,${d * 0.25})`;
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(0.5, col);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(x - bw, 0, bw * 2, h);
  }

  // fine fibres
  for (let i = 0; i < 520; i++) {
    let x = rand() * w;
    const alpha = 0.04 + rand() * 0.16;
    const dark = rand() > 0.25;
    ctx.strokeStyle = dark ? `rgba(${r * 0.45 | 0},${g * 0.4 | 0},${b * 0.38 | 0},${alpha})` : `rgba(255,236,210,${alpha * 0.25})`;
    ctx.lineWidth = 0.6 + rand() * 1.8;
    ctx.beginPath();
    const amp = 2 + rand() * 6;
    const freq = 0.002 + rand() * 0.004;
    const ph = rand() * 6.28;
    ctx.moveTo(x, 0);
    for (let y = 0; y <= h; y += 16) {
      x += (rand() - 0.5) * 0.6;
      ctx.lineTo(x + Math.sin(y * freq + ph) * amp, y);
    }
    ctx.stroke();
  }

  // cathedral arches
  for (let k = 0; k < 3; k++) {
    const cx = w * (0.2 + rand() * 0.6);
    const top = h * (0.15 + rand() * 0.6);
    for (let j = 0; j < 9; j++) {
      const spread = 18 + j * 9;
      ctx.strokeStyle = `rgba(${r * 0.4 | 0},${g * 0.35 | 0},${b * 0.32 | 0},${0.08 + rand() * 0.1})`;
      ctx.lineWidth = 1 + rand() * 2;
      ctx.beginPath();
      ctx.moveTo(cx - spread, top + 900);
      ctx.bezierCurveTo(cx - spread, top + j * 18, cx + spread, top + j * 18, cx + spread, top + 900);
      ctx.stroke();
    }
  }

  // pores
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.05 + rand() * 0.12})`;
    ctx.fillRect(rand() * w, rand() * h, 1, 2 + rand() * 6);
  }
  return c;
}

/** Fine surface noise for paint, laminate and plaster. */
function noiseCanvas(seed: number, size = 256, strength = 18): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const rand = rng(seed);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (rand() - 0.5) * strength;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function canvasTexture(key: string, make: () => HTMLCanvasElement, srgb: boolean, repeat: [number, number] = [1, 1]) {
  const k = `${key}|${srgb}|${repeat.join("x")}`;
  let t = texCache.get(k);
  if (!t) {
    t = new THREE.CanvasTexture(make());
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(k, t);
  }
  return t;
}

export interface DoorMaterials {
  surface: THREE.MeshPhysicalMaterial;
  recess: THREE.MeshPhysicalMaterial;
  groove: THREE.MeshStandardMaterial;
  frame: THREE.MeshPhysicalMaterial;
  metal: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  rubber: THREE.MeshStandardMaterial;
  screen: THREE.MeshStandardMaterial;
  accentBrass: THREE.MeshStandardMaterial;
}

const FRAME_COLOURS: Record<string, string> = { teak: "#7A4D2A", sal: "#86603F", wpc: "#E2DFD7" };

function surfaceFor(finish: FinishId, hex: string, grain: boolean, seed: number) {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff });
  if (grain) {
    m.map = canvasTexture(`wood-${hex}-${seed}`, () => woodCanvas(hex, seed), true);
    m.bumpMap = canvasTexture(`wood-${hex}-${seed}`, () => woodCanvas(hex, seed), false);
    m.bumpScale = 0.35;
    m.roughness = finish === "laminate" ? 0.62 : 0.5;
    m.clearcoat = finish === "veneer" ? 0.25 : 0.08;
    m.clearcoatRoughness = 0.55;
  } else {
    m.color = new THREE.Color(hex);
    m.bumpMap = canvasTexture(`noise-${seed}`, () => noiseCanvas(seed), false, [8, 16]);
    m.bumpScale = 0.04;
    m.roughness = finish === "pu" ? 0.42 : finish === "membrane" ? 0.36 : 0.58;
    m.clearcoat = finish === "pu" ? 0.18 : 0.05;
    m.clearcoatRoughness = 0.5;
    m.sheen = 0.15;
  }
  return m;
}

export function buildMaterials(c: DoorConfig): DoorMaterials {
  const col = colourOf(c);
  const finish = getFinish(c.finish);
  const surface = surfaceFor(finish.id, col.hex, !!col.grain, 7);
  const recess = surface.clone();
  recess.color = surface.map ? new THREE.Color(0.86, 0.84, 0.82) : new THREE.Color(col.hex).multiplyScalar(0.92);

  const frameHex = FRAME_COLOURS[c.frame] ?? col.hex;
  const frameGrain = c.frame === "teak" || c.frame === "sal" || (!FRAME_COLOURS[c.frame] && !!col.grain);
  const frame = surfaceFor(c.frame === "wpc" ? "membrane" : "veneer", frameHex, frameGrain, 11);

  const metal = metalFor(c.hw);
  const glassOpt = getGlass(c.glass);
  const glass = glassFor(c.glass, glassOpt.fill);

  return {
    surface,
    recess,
    groove: new THREE.MeshStandardMaterial({ color: new THREE.Color(col.hex).multiplyScalar(0.28), roughness: 0.9 }),
    frame,
    metal,
    glass,
    rubber: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.6, metalness: 0.2 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0b1820, emissive: new THREE.Color("#3f88b5"), emissiveIntensity: 0.55, roughness: 0.15, metalness: 0.1 }),
    accentBrass: metalFor("brass"),
  };
}

export function metalFor(id: HardwareFinishId) {
  const hw = getHardwareFinish(id);
  const black = id === "black";
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(black ? "#26272a" : hw.hex),
    metalness: black ? 0.55 : 1,
    roughness: black ? 0.48 : id === "steel" ? 0.32 : 0.26,
  });
}

function glassFor(id: GlassId, fill: string) {
  const smoked = id === "smoked";
  const clear = id === "clear";
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(fill),
    metalness: 0,
    roughness: clear ? 0.04 : smoked ? 0.12 : 0.55,
    transmission: smoked ? 0.55 : 0.92,
    thickness: 0.006,
    ior: 1.5,
    transparent: true,
    opacity: smoked ? 0.9 : 1,
  });
  if (id === "fluted") {
    const t = canvasTexture("fluted", () => {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 4;
      const ctx = c.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, 64, 0);
      g.addColorStop(0, "#202020");
      g.addColorStop(0.5, "#ffffff");
      g.addColorStop(1, "#202020");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 4);
      return c;
    }, false, [9, 1]);
    m.bumpMap = t;
    m.bumpScale = 1.4;
    m.roughness = 0.25;
  }
  return m;
}

export function plasterMaterial(hex: string) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness: 0.94,
    bumpMap: canvasTexture("plaster", () => noiseCanvas(3, 256, 40), false, [12, 12]),
    bumpScale: 0.25,
  });
}

export function floorMaterial(hex: string) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness: 0.28,
    metalness: 0,
    bumpMap: canvasTexture("floor", () => noiseCanvas(5, 256, 30), false, [20, 20]),
    bumpScale: 0.05,
  });
}

export function disposeMaterials(m: DoorMaterials) {
  for (const mat of Object.values(m)) (mat as THREE.Material).dispose();
}
