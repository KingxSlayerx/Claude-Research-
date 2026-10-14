/**
 * Composes architectural placeholder scenes as SVG (units: millimetres).
 * These are temporary art-directed illustrations that hold the place of
 * real photography. See docs/ASSETS.md for the shot list that replaces them.
 */
import type { DoorConfig } from "../../src/domain/config";
import { renderDoorSvg, shade } from "../../src/render/door-svg";

export interface SceneOptions {
  /** Scene width and height in mm (the visible "camera" frame). */
  width: number;
  height: number;
  /** Floor line, measured from the top, in mm. */
  floorY: number;
  wall: string;
  floor: string;
  door?: { cfg: DoorConfig; x: number };
  /** Door opening only (no door) — for visualiser sample scenes. */
  opening?: { x: number; w: number; h: number };
  stone?: { x: number; w: number; tone: string };
  tiles?: { y: number; tone: string };
  light?: "jaali" | "window" | "soft" | "dusk";
  jaaliX?: number;
  props?: Prop[];
  ceiling?: number;
  vignette?: number;
}

export type Prop =
  | { kind: "plant"; x: number; scale?: number; pot?: string }
  | { kind: "palm"; x: number; scale?: number; pot?: string }
  | { kind: "sconce"; x: number; y: number }
  | { kind: "pendant"; x: number; y: number }
  | { kind: "bench"; x: number; w: number; tone: string }
  | { kind: "art"; x: number; y: number; w: number; h: number; tone: string }
  | { kind: "vase"; x: number; y: number; tone: string }
  | { kind: "shelf"; x: number; y: number; w: number }
  | { kind: "window"; x: number; y: number; w: number; h: number }
  | { kind: "rug"; x: number; w: number; tone: string }
  | { kind: "step"; x: number; w: number; h: number; tone: string }
  | { kind: "urli"; x: number; tone: string };

let uid = 0;

export function composeScene(o: SceneOptions): string {
  const id = `s${++uid}`;
  const { width: W, height: H, floorY: FY } = o;
  let defs = `
  <filter id="${id}n" x="0" y="0" width="1" height="1" primitiveUnits="userSpaceOnUse">
    <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="11"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.2 -0.45"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="${id}p" x="0" y="0" width="1" height="1" primitiveUnits="userSpaceOnUse">
    <feTurbulence type="fractalNoise" baseFrequency="0.004 0.006" numOctaves="4" seed="5"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.1 -0.38"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="${id}b8"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="${id}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="${id}b80" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="80"/></filter>
  <linearGradient id="${id}fl" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="${shade(o.floor, -0.18)}"/><stop offset=".25" stop-color="${o.floor}"/><stop offset="1" stop-color="${shade(o.floor, 0.06)}"/>
  </linearGradient>
  <radialGradient id="${id}vg" cx=".5" cy=".45" r=".75">
    <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1b140c" stop-opacity="${o.vignette ?? 0.35}"/>
  </radialGradient>`;

  let back = "";
  let mid = "";
  let front = "";

  // wall + plaster texture
  back += `<rect width="${W}" height="${FY}" fill="${o.wall}"/>
    <rect width="${W}" height="${FY}" fill="${shade(o.wall, -0.1)}" filter="url(#${id}p)" opacity=".14"/>
    <rect width="${W}" height="${FY}" fill="#000" filter="url(#${id}n)" opacity=".06"/>`;
  if (o.ceiling) back += `<rect width="${W}" height="${o.ceiling}" fill="${shade(o.wall, -0.12)}"/>`;

  if (o.stone) {
    const { x, w, tone } = o.stone;
    let y = o.ceiling ?? 0;
    let i = 0;
    while (y < FY) {
      const h = 140 + ((i * 53) % 90);
      let xx = x;
      let j = 0;
      while (xx < x + w) {
        const sw = 600 + (((i + 1) * (j + 3) * 97) % 700);
        const t = shade(tone, (((i * 7 + j * 13) % 9) - 4) * 0.025);
        back += `<rect x="${xx}" y="${y}" width="${Math.min(sw, x + w - xx) - 8}" height="${h - 8}" fill="${t}"/>`;
        xx += sw;
        j++;
      }
      y += h;
      i++;
    }
    back += `<rect x="${x}" y="${o.ceiling ?? 0}" width="${w}" height="${FY - (o.ceiling ?? 0)}" fill="#000" filter="url(#${id}n)" opacity=".12"/>`;
  }

  if (o.tiles) {
    const { y, tone } = o.tiles;
    for (let ty = y; ty < FY; ty += 100)
      for (let tx = 0; tx < W; tx += 100)
        back += `<rect x="${tx + 2}" y="${ty + 2}" width="96" height="96" fill="${shade(tone, (((tx / 100) * 7 + (ty / 100) * 3) % 7 - 3) * 0.02)}"/>`;
    back += `<rect y="${y}" width="${W}" height="${FY - y}" fill="${shade(tone, -0.3)}" opacity=".12"/>`;
  }

  // floor
  back += `<rect y="${FY}" width="${W}" height="${H - FY}" fill="url(#${id}fl)"/>
    <rect y="${FY}" width="${W}" height="${H - FY}" fill="#000" filter="url(#${id}n)" opacity=".08"/>`;

  for (const p of o.props ?? []) {
    if (p.kind === "window") {
      back += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#3d4a33"/>
        <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#9fb08a" opacity=".55" filter="url(#${id}p)"/>
        <ellipse cx="${p.x + p.w * 0.4}" cy="${p.y + p.h * 0.35}" rx="${p.w * 0.5}" ry="${p.h * 0.4}" fill="#c9d6b0" opacity=".5" filter="url(#${id}b80)"/>
        <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="none" stroke="#2a2a28" stroke-width="40"/>
        <line x1="${p.x + p.w / 2}" y1="${p.y}" x2="${p.x + p.w / 2}" y2="${p.y + p.h}" stroke="#2a2a28" stroke-width="24"/>`;
    }
    if (p.kind === "art")
      back += `<rect x="${p.x + 20}" y="${p.y + 30}" width="${p.w}" height="${p.h}" fill="#000" opacity=".18" filter="url(#${id}b30)"/>
        <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#f3efe6"/>
        <rect x="${p.x + p.w * 0.12}" y="${p.y + p.h * 0.12}" width="${p.w * 0.76}" height="${p.h * 0.76}" fill="${p.tone}"/>
        <circle cx="${p.x + p.w * 0.6}" cy="${p.y + p.h * 0.42}" r="${p.w * 0.18}" fill="${shade(p.tone, -0.25)}"/>
        <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="none" stroke="#2b241c" stroke-width="18"/>`;
    if (p.kind === "shelf") {
      back += `<rect x="${p.x}" y="${p.y + 10}" width="${p.w}" height="40" fill="#000" opacity=".2" filter="url(#${id}b8)"/><rect x="${p.x}" y="${p.y}" width="${p.w}" height="36" fill="#8a6440"/>`;
      const items = [
        [0.12, 180, 120, "#e9e2d4"],
        [0.3, 260, 90, "#6f7a5e"],
        [0.5, 140, 160, "#c9b79c"],
        [0.72, 220, 110, "#3c3a36"],
      ] as const;
      for (const [fx, h, w, c] of items)
        back += `<rect x="${p.x + p.w * fx}" y="${p.y - h}" width="${w}" height="${h}" rx="${w / 3}" fill="${c}"/><rect x="${p.x + p.w * fx}" y="${p.y - h}" width="${w * 0.3}" height="${h}" rx="${w / 6}" fill="#fff" opacity=".18"/>`;
    }
  }

  // light pass on the wall (behind door)
  const light = o.light ?? "soft";
  if (light === "window" || light === "soft")
    back += `<ellipse cx="${W * 0.18}" cy="${FY * 0.2}" rx="${W * 0.55}" ry="${FY * 0.7}" fill="#fff6e6" opacity="${light === "window" ? 0.32 : 0.22}" filter="url(#${id}b80)"/>`;
  if (light === "dusk")
    back += `<rect width="${W}" height="${FY}" fill="#2b2118" opacity=".35"/>`;

  // opening only (sample scenes)
  if (o.opening) {
    const { x, w, h } = o.opening;
    mid += `<rect x="${x - 70}" y="${FY - h - 70}" width="${w + 140}" height="${h + 70}" fill="${shade(o.wall, 0.08)}"/>
      <rect x="${x}" y="${FY - h}" width="${w}" height="${h}" fill="#3a3129"/>
      <rect x="${x}" y="${FY - h}" width="${w}" height="${h}" fill="url(#${id}fl)" opacity=".2"/>
      <rect x="${x}" y="${FY - h}" width="${w * 0.12}" height="${h}" fill="#000" opacity=".25"/>`;
  }

  // door
  if (o.door) {
    const r = renderDoorSvg(o.door.cfg, { mode: "bare", idPrefix: id + "d", decorative: true });
    const [vx, vy, vw, vh] = r.viewBox;
    const x = o.door.x + vx;
    const y = FY - o.door.cfg.h + vy;
    mid += `<rect x="${x + 40}" y="${y + 60}" width="${vw}" height="${vh}" fill="#000" opacity=".22" filter="url(#${id}b30)"/>`;
    mid += r.svg.replace("<svg ", `<svg x="${x}" y="${y}" width="${vw}" height="${vh}" `);
    mid += `<g opacity=".14" transform="translate(0 ${2 * FY}) scale(1 -1)">${r.svg.replace("<svg ", `<svg x="${x}" y="${y}" width="${vw}" height="${vh}" `)}</g>`;
    mid += `<rect y="${FY}" width="${W}" height="${H - FY}" fill="url(#${id}fl)" opacity=".55"/>`;
    mid += `<ellipse cx="${o.door.x + o.door.cfg.w / 2}" cy="${FY + 10}" rx="${o.door.cfg.w * 0.7}" ry="45" fill="#000" opacity=".28" filter="url(#${id}b8)"/>`;
  }

  if (o.ceiling) mid += `<rect y="${o.ceiling}" width="${W}" height="60" fill="#000" opacity=".12" filter="url(#${id}b30)"/>`;

  // skirting
  mid += `<rect y="${FY - 90}" width="${W}" height="90" fill="${shade(o.wall, 0.05)}" opacity=".0"/>`;

  // cast light
  if (light === "jaali") {
    let patches = "";
    const cols = 14,
      rows = 16,
      cell = 230;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const cx = c * cell + (r % 2) * (cell / 2);
        const cy = r * cell;
        patches += `<path d="M${cx} ${cy - 104}L${cx + 104} ${cy}L${cx} ${cy + 104}L${cx - 104} ${cy}Z"/>`;
      }
    const jx = o.jaaliX ?? W * 0.3;
    defs += `<clipPath id="${id}wc"><path d="M${jx - 200} 0H${jx + 2600}L${jx + 1500} ${FY * 0.92}H${jx - 1300}Z"/></clipPath>`;
    front = `<rect width="${W}" height="${FY}" fill="#2a1d10" opacity=".1"/>` + front;
    front += `<g clip-path="url(#${id}wc)"><g transform="translate(${jx - 1400} ${-FY * 0.1}) skewX(-24)" fill="#ffe9c4" opacity=".34" filter="url(#${id}b8)">${patches}</g></g>`;
  }

  for (const p of o.props ?? []) {
    const s = "scale" in p && p.scale ? p.scale : 1;
    switch (p.kind) {
      case "plant": {
        const pot = p.pot ?? "#3a3631";
        let leaves = "";
        for (let i = 0; i < 9; i++) {
          const a = (i - 4) * 0.12;
          const h = (900 + ((i * 137) % 500)) * s;
          const bx = p.x + (i - 4) * 18 * s;
          const tx = bx + Math.sin(a) * h;
          const col = shade("#4f6b3a", ((i % 3) - 1) * 0.12);
          leaves += `<path d="M${bx - 28 * s} ${FY - 480 * s} Q${bx + Math.sin(a) * h * 0.5 - 40 * s} ${FY - 480 * s - h * 0.55} ${tx} ${FY - 480 * s - h} Q${bx + Math.sin(a) * h * 0.5 + 40 * s} ${FY - 480 * s - h * 0.55} ${bx + 28 * s} ${FY - 480 * s}Z" fill="${col}"/>
            <path d="M${bx} ${FY - 480 * s} Q${bx + Math.sin(a) * h * 0.5} ${FY - 480 * s - h * 0.55} ${tx} ${FY - 480 * s - h}" stroke="${shade(col, 0.25)}" stroke-width="${5 * s}" fill="none" opacity=".6"/>`;
        }
        front += `<ellipse cx="${p.x + 60 * s}" cy="${FY + 6}" rx="${300 * s}" ry="${40 * s}" fill="#000" opacity=".3" filter="url(#${id}b30)"/>${leaves}
          <path d="M${p.x - 230 * s} ${FY - 500 * s}H${p.x + 230 * s}L${p.x + 190 * s} ${FY}H${p.x - 190 * s}Z" fill="${pot}"/>
          <path d="M${p.x - 230 * s} ${FY - 500 * s}H${p.x - 120 * s}L${p.x - 110 * s} ${FY}H${p.x - 190 * s}Z" fill="#fff" opacity=".08"/>
          <path d="M${p.x + 100 * s} ${FY - 500 * s}H${p.x + 230 * s}L${p.x + 190 * s} ${FY}H${p.x + 110 * s}Z" fill="#000" opacity=".2"/>`;
        break;
      }
      case "palm": {
        const pot = p.pot ?? "#b07a55";
        let fronds = "";
        const baseY = FY - 420 * s;
        for (let i = 0; i < 7; i++) {
          const ang = -Math.PI / 2 + (i - 3) * 0.32;
          const len = (1100 + ((i * 211) % 400)) * s;
          const ex = p.x + Math.cos(ang) * len;
          const ey = baseY + Math.sin(ang) * len * 0.95;
          const mx = p.x + Math.cos(ang) * len * 0.5 + (i - 3) * 40 * s;
          const my = baseY + Math.sin(ang) * len * 0.62;
          const col = shade("#56703f", ((i % 3) - 1) * 0.1);
          fronds += `<path d="M${p.x} ${baseY} Q${mx} ${my} ${ex} ${ey}" stroke="${shade(col, -0.2)}" stroke-width="${10 * s}" fill="none"/>`;
          for (let k = 2; k < 14; k++) {
            const t = k / 14;
            const qx = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * mx + t * t * ex;
            const qy = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * my + t * t * ey;
            const l = 260 * s * Math.sin(t * Math.PI);
            fronds += `<path d="M${qx} ${qy} l${-l * 0.8} ${l * 0.55} M${qx} ${qy} l${l * 0.8} ${l * 0.55}" stroke="${col}" stroke-width="${26 * s}" stroke-linecap="round"/>`;
          }
        }
        front += `<ellipse cx="${p.x + 60 * s}" cy="${FY + 6}" rx="${330 * s}" ry="${44 * s}" fill="#000" opacity=".3" filter="url(#${id}b30)"/>${fronds}
          <ellipse cx="${p.x}" cy="${FY - 420 * s}" rx="${240 * s}" ry="${50 * s}" fill="${shade(pot, -0.2)}"/>
          <path d="M${p.x - 240 * s} ${FY - 420 * s}Q${p.x - 260 * s} ${FY - 80 * s} ${p.x - 150 * s} ${FY}H${p.x + 150 * s}Q${p.x + 260 * s} ${FY - 80 * s} ${p.x + 240 * s} ${FY - 420 * s}Z" fill="${pot}"/>
          <path d="M${p.x + 80 * s} ${FY - 420 * s}Q${p.x + 260 * s} ${FY - 80 * s} ${p.x + 150 * s} ${FY}H${p.x + 60 * s}Z" fill="#000" opacity=".18"/>`;
        break;
      }
      case "sconce":
        front += `<ellipse cx="${p.x}" cy="${p.y}" rx="380" ry="620" fill="#ffd9a0" opacity=".42" filter="url(#${id}b80)"/>
          <rect x="${p.x - 40}" y="${p.y - 150}" width="80" height="300" rx="40" fill="#b08a4f"/>
          <rect x="${p.x - 40}" y="${p.y - 150}" width="26" height="300" rx="13" fill="#f5deb0" opacity=".5"/>
          <rect x="${p.x - 34}" y="${p.y + 120}" width="68" height="18" fill="#fff3d6" opacity=".9"/>`;
        break;
      case "pendant":
        front += `<line x1="${p.x}" y1="0" x2="${p.x}" y2="${p.y}" stroke="#2a2622" stroke-width="8"/>
          <ellipse cx="${p.x}" cy="${p.y + 260}" rx="420" ry="300" fill="#ffd9a0" opacity=".35" filter="url(#${id}b80)"/>
          <path d="M${p.x - 170} ${p.y + 170}Q${p.x} ${p.y - 60} ${p.x + 170} ${p.y + 170}Z" fill="#b08a4f"/>
          <ellipse cx="${p.x}" cy="${p.y + 172}" rx="170" ry="22" fill="#fff1cf"/>`;
        break;
      case "bench":
        front += `<ellipse cx="${p.x + p.w / 2}" cy="${FY + 4}" rx="${p.w * 0.6}" ry="40" fill="#000" opacity=".28" filter="url(#${id}b30)"/>
          <rect x="${p.x}" y="${FY - 450}" width="${p.w}" height="70" fill="${p.tone}"/>
          <rect x="${p.x}" y="${FY - 450}" width="${p.w}" height="14" fill="#fff" opacity=".15"/>
          <rect x="${p.x + 60}" y="${FY - 380}" width="50" height="380" fill="${shade(p.tone, -0.25)}"/>
          <rect x="${p.x + p.w - 110}" y="${FY - 380}" width="50" height="380" fill="${shade(p.tone, -0.25)}"/>`;
        break;
      case "vase":
        front += `<path d="M${p.x - 70} ${p.y}Q${p.x - 120} ${p.y - 200} ${p.x - 40} ${p.y - 300}H${p.x + 40}Q${p.x + 120} ${p.y - 200} ${p.x + 70} ${p.y}Z" fill="${p.tone}"/>
          <path d="M${p.x} ${p.y - 300}Q${p.x - 60} ${p.y - 700} ${p.x - 260} ${p.y - 980}M${p.x} ${p.y - 300}Q${p.x + 40} ${p.y - 640} ${p.x + 220} ${p.y - 900}M${p.x - 120} ${p.y - 640}l-120 -60M${p.x + 90} ${p.y - 620}l110 -40" stroke="#4a3a2a" stroke-width="10" fill="none" stroke-linecap="round"/>`;
        break;
      case "rug":
        front += `<path d="M${p.x} ${FY + 260}L${p.x + p.w} ${FY + 260}L${p.x + p.w - 140} ${FY + 40}L${p.x + 140} ${FY + 40}Z" fill="${p.tone}"/>
          <path d="M${p.x + 60} ${FY + 230}L${p.x + p.w - 60} ${FY + 230}L${p.x + p.w - 170} ${FY + 70}L${p.x + 170} ${FY + 70}Z" fill="none" stroke="${shade(p.tone, -0.2)}" stroke-width="12"/>`;
        break;
      case "step":
        mid += `<rect x="${p.x}" y="${FY - p.h}" width="${p.w}" height="${p.h}" fill="${p.tone}"/>
          <rect x="${p.x}" y="${FY - p.h}" width="${p.w}" height="12" fill="#fff" opacity=".25"/>
          <rect x="${p.x}" y="${FY - p.h}" width="${p.w}" height="${p.h}" fill="#000" filter="url(#${id}n)" opacity=".15"/>`;
        break;
      case "urli":
        front += `<ellipse cx="${p.x}" cy="${FY + 4}" rx="420" ry="50" fill="#000" opacity=".3" filter="url(#${id}b30)"/>
          <path d="M${p.x - 380} ${FY - 260}Q${p.x} ${FY + 60} ${p.x + 380} ${FY - 260}Z" fill="${p.tone}"/>
          <ellipse cx="${p.x}" cy="${FY - 260}" rx="380" ry="46" fill="${shade(p.tone, -0.25)}"/>
          <ellipse cx="${p.x}" cy="${FY - 262}" rx="330" ry="32" fill="#6f8a8f" opacity=".7"/>
          ${[-160, -40, 90, 200].map((dx, i) => `<circle cx="${p.x + dx}" cy="${FY - 268 + (i % 2) * 6}" r="34" fill="${i % 2 ? "#e9b44c" : "#f1e7d0"}"/>`).join("")}`;
        break;
    }
  }

  const overlay = `<rect width="${W}" height="${H}" fill="url(#${id}vg)"/>` + (light === "dusk" ? `<rect width="${W}" height="${H}" fill="#ff9a3c" opacity=".06"/>` : "");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${back}${mid}${front}${overlay}</svg>`;
}

/** Close-up material study: a large surface with grain, used for the material story. */
export function materialStudy(opts: { tones: string[]; grain: boolean; kind: "planks" | "samples" | "hardware" }): string {
  const W = 2400,
    H = 1600;
  const id = `m${++uid}`;
  let s = `<defs>
    <filter id="${id}g" x="0" y="0" width="1" height="1" primitiveUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.035 0.0016" numOctaves="4" seed="9"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.9 -0.7"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="${id}b"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="${id}n" x="0" y="0" width="1" height="1" primitiveUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" seed="2"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 -0.4"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <linearGradient id="${id}l" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
  </defs>`;
  if (opts.kind === "planks") {
    const n = opts.tones.length;
    const pw = W / n;
    opts.tones.forEach((t, i) => {
      s += `<g transform="translate(${i * pw} 0)"><rect width="${pw - 6}" height="${H}" fill="${t}"/><rect width="${pw - 6}" height="${H}" fill="${shade(t, -0.45)}" filter="url(#${id}g)" opacity=".6"/></g>`;
    });
    s += `<rect width="${W}" height="${H}" fill="url(#${id}l)"/>`;
  } else if (opts.kind === "samples") {
    s += `<rect width="${W}" height="${H}" fill="#e8e1d5"/><rect width="${W}" height="${H}" fill="#000" filter="url(#${id}n)" opacity=".05"/>`;
    opts.tones.forEach((t, i) => {
      const x = 260 + i * 330,
        y = 300 + (i % 2) * 90,
        rot = -8 + i * 3;
      s += `<g transform="rotate(${rot} ${x + 200} ${y + 500})">
        <rect x="${x + 30}" y="${y + 50}" width="420" height="1000" fill="#000" opacity=".22" filter="url(#${id}b)"/>
        <rect x="${x}" y="${y}" width="420" height="1000" fill="${t}"/>
        ${opts.grain && i % 2 === 0 ? `<rect x="${x}" y="${y}" width="420" height="1000" fill="${shade(t, -0.45)}" filter="url(#${id}g)" opacity=".55"/>` : ""}
        <rect x="${x}" y="${y}" width="420" height="1000" fill="url(#${id}l)"/>
        <circle cx="${x + 210}" cy="${y + 70}" r="22" fill="#000" opacity=".25"/></g>`;
    });
  } else {
    const t = opts.tones[0];
    s += `<rect width="${W}" height="${H}" fill="${t}"/><rect width="${W}" height="${H}" fill="${shade(t, -0.45)}" filter="url(#${id}g)" opacity=".55"/><rect width="${W}" height="${H}" fill="url(#${id}l)"/>`;
    const brass = "#b08a4f";
    s += `<defs><linearGradient id="${id}m" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f1d9a6"/><stop offset=".35" stop-color="${brass}"/><stop offset="1" stop-color="#5e4520"/></linearGradient>
      <linearGradient id="${id}r" x1="0" x2="1"><stop offset="0" stop-color="#f1d9a6"/><stop offset=".5" stop-color="${brass}"/><stop offset="1" stop-color="#4d3818"/></linearGradient></defs>
      <rect x="1490" y="420" width="260" height="840" rx="130" fill="#000" opacity=".35" filter="url(#${id}b)"/>
      <rect x="1460" y="380" width="240" height="840" rx="120" fill="url(#${id}r)"/>
      <rect x="560" y="740" width="1040" height="200" rx="100" fill="#000" opacity=".35" filter="url(#${id}b)"/>
      <rect x="520" y="690" width="1060" height="170" rx="85" fill="url(#${id}m)"/>
      <rect x="560" y="704" width="980" height="36" rx="18" fill="#fff" opacity=".35"/>
      <circle cx="1580" cy="1100" r="60" fill="#3a2a14"/><rect x="1568" y="1100" width="24" height="90" fill="#3a2a14"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${s}</svg>`;
}
