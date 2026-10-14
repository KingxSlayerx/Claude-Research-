/**
 * Door illustration renderer. Returns an SVG string drawn in millimetres.
 *
 * Geometry per style is carried over from the original site's `doorSVG`;
 * materials are upgraded (procedural wood grain, soft lighting, metallic
 * hardware). Every interpolated value is a number or comes from the typed
 * catalogue, and text is escaped, so the output is safe to inject.
 *
 * This is an illustration of the configuration, not a photorealistic render.
 */
import { getGlass, getHardwareFinish, getStyle } from "@/domain/catalog";
import { colourOf, type DoorConfig } from "@/domain/config";
import { feetInches } from "@/domain/format";

export type DoorRenderMode = "scene" | "bare" | "mini";

export interface DoorRenderOptions {
  mode?: DoorRenderMode;
  /** Draw width/height dimension lines (scene mode). */
  dims?: boolean;
  /** Unique, alphanumeric prefix for SVG ids. Required when several doors share a page. */
  idPrefix?: string;
  /** Accessible label. Defaults to "<Style> door, <colour>". */
  label?: string;
  /** Omit the root <svg> role/label (when decorative). */
  decorative?: boolean;
}

export interface DoorRender {
  svg: string;
  viewBox: [number, number, number, number];
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16,
    g = (n >> 8) & 255,
    b = n & 255;
  const t = amt < 0 ? 0 : 255,
    p = Math.abs(amt);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

const FRAME_COLOURS: Record<string, string> = { teak: "#7A4D2A", sal: "#86603F", wpc: "#E2DFD7" };

let counter = 0;

export function renderDoorSvg(c: DoorConfig, opts: DoorRenderOptions = {}): DoorRender {
  const { mode = "scene", dims = false, decorative = false } = opts;
  // A caller-supplied prefix keeps ids identical between server and client renders.
  const n = opts.idPrefix ? opts.idPrefix.replace(/[^a-zA-Z0-9_-]/g, "") : "d" + (++counter).toString(36);
  const s = getStyle(c.style);
  const W = c.w,
    H = c.h;
  const col = colourOf(c);
  const base = col.hex;
  const F = s.noFrame || c.frame === "none" ? 0 : 55;
  const A = !s.noFrame && c.arch ? 75 : 0;
  const O = F + A;
  const barn = c.style === "barn";
  const top = -O - (barn ? 190 : 0);

  let vb: [number, number, number, number];
  if (mode === "mini") vb = [W / 2 - 1050, H - 2950, 2100, 3100];
  else if (mode === "bare") vb = [-O - (barn ? 80 : 0), top, W + 2 * O + (barn ? 160 : 0), H - top];
  else {
    const x0 = -O - (dims ? 340 : 260),
      x1 = W + O + (dims ? 440 : 260),
      y0 = top - (dims ? 380 : 260);
    vb = [x0, y0, x1 - x0, H + 190 - y0];
  }

  const dark = shade(base, -0.32);
  const light = shade(base, 0.22);
  const hwHex = getHardwareFinish(c.hw).hex;
  const glass = getGlass(c.glass);
  const lum = luminance(base);

  const defs = `<defs>
    <filter id="gf${n}" x="0" y="0" width="1" height="1" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.045 0.0018" numOctaves="3" seed="${(c.color.length * 7) % 97}"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.7 -0.62"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="gn${n}" x="0" y="0" width="1" height="1" primitiveUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.3"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <linearGradient id="lg${n}" x1="0" x2="1" y1="0" y2="0.25">
      <stop offset="0" stop-color="#fff" stop-opacity="${lum > 0.6 ? 0.16 : 0.12}"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="${lum > 0.6 ? 0.1 : 0.18}"/>
    </linearGradient>
    <linearGradient id="hw${n}" x1="0" x2="1">
      <stop offset="0" stop-color="${shade(hwHex, 0.35)}"/><stop offset=".45" stop-color="${hwHex}"/><stop offset="1" stop-color="${shade(hwHex, -0.35)}"/>
    </linearGradient>
    <linearGradient id="gl${n}" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${shade(glass.fill, 0.25)}"/><stop offset="1" stop-color="${shade(glass.fill, -0.08)}"/>
    </linearGradient>
    <pattern id="fl${n}" patternUnits="userSpaceOnUse" width="16" height="16">
      <rect width="16" height="16" fill="${glass.fill}"/><rect width="5" height="16" fill="#fff" opacity=".4"/><rect x="12" width="2" height="16" fill="#000" opacity=".06"/>
    </pattern>
    <radialGradient id="sh${n}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="wl${n}" gradientUnits="userSpaceOnUse" cx="${vb[0] + vb[2] * 0.15}" cy="${vb[1]}" r="${Math.max(vb[2], vb[3]) * 1.1}">
      <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".1"/>
    </radialGradient>
    <linearGradient id="fg${n}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
  </defs>`;

  /** A surface in the door's material: base colour plus grain where the colour has it. */
  const surface = (x: number, y: number, w: number, h: number, extra = "") =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${base}"${extra}/>` +
    (col.grain
      ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${shade(base, -0.42)}" filter="url(#gf${n})" opacity=".5"/>`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000" filter="url(#gn${n})" opacity=".05"/>`);

  const panel = (x: number, y: number, w: number, h: number, raised = false) =>
    surface(x, y, w, h) +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000" opacity="${raised ? 0 : 0.06}"/>
    <path d="M${x} ${y + h}V${y}H${x + w}" stroke="${raised ? light : dark}" stroke-width="10" fill="none" opacity=".85"/>
    <path d="M${x + w} ${y}V${y + h}H${x}" stroke="${raised ? dark : light}" stroke-width="10" fill="none" opacity=".85"/>
    ${raised ? `<rect x="${x + 40}" y="${y + 40}" width="${w - 80}" height="${h - 80}" fill="none" stroke="${dark}" stroke-width="4" opacity=".45"/><rect x="${x + 44}" y="${y + 44}" width="${w - 88}" height="${h - 88}" fill="none" stroke="${light}" stroke-width="2" opacity=".4"/>` : ""}`;

  let d = "";

  if (mode !== "bare") {
    const X0 = vb[0] - 6000,
      XW = vb[2] + 12000,
      Y0 = vb[1] - 6000;
    d += `<rect x="${X0}" y="${Y0}" width="${XW}" height="${H - Y0}" style="fill:var(--scene-wall,#E8E1D4)"/>
      <rect x="${X0}" y="${Y0}" width="${XW}" height="${H - Y0}" fill="url(#wl${n})"/>
      <rect x="${X0}" y="${H}" width="${XW}" height="6000" style="fill:var(--scene-floor,#C9B79C)"/>
      <rect x="${X0}" y="${H}" width="${XW}" height="140" fill="url(#fg${n})"/>
      <rect x="${X0}" y="${H - 100}" width="${-O - X0}" height="100" style="fill:var(--scene-skirt,#F1ECE3)"/>
      <rect x="${W + O}" y="${H - 100}" width="${X0 + XW - W - O}" height="100" style="fill:var(--scene-skirt,#F1ECE3)"/>
      <ellipse cx="${W / 2}" cy="${H + 14}" rx="${W * 0.66}" ry="40" fill="url(#sh${n})"/>`;
  }

  // frame + architrave
  const fcol = FRAME_COLOURS[c.frame] ?? base;
  if (A)
    d += `<path d="M${-O} ${H}V${-O}H${W + O}V${H}H${W + F}V${-F}H${-F}V${H}Z" fill="${fcol}"/><path d="M${-O} ${H}V${-O}H${W + O}" stroke="${shade(fcol, 0.25)}" stroke-width="8" fill="none"/><path d="M${-F} ${H}V${-F}H${W + F}V${H}" stroke="${shade(fcol, -0.35)}" stroke-width="6" fill="none"/>`;
  if (F)
    d += `<path d="M${-F} ${H}V${-F}H${W + F}V${H}H${W}V0H0V${H}Z" fill="${shade(fcol, -0.08)}"/><path d="M0 ${H}V0H${W}V${H}" stroke="${shade(fcol, -0.45)}" stroke-width="6" fill="none"/>`;
  if (mode !== "bare" && !F && !barn)
    d += `<rect x="-14" y="-14" width="${W + 28}" height="${H + 14}" fill="#000" opacity=".22"/>`;

  // barn track
  if (barn)
    d += `<rect x="-60" y="-150" width="${W + 120}" height="34" rx="6" fill="#2A2B2C"/>
      ${[W * 0.2, W * 0.8]
        .map(
          (x) =>
            `<circle cx="${x}" cy="-110" r="44" fill="#2A2B2C"/><circle cx="${x}" cy="-110" r="14" fill="#6B6E70"/><rect x="${x - 14}" y="-110" width="28" height="170" fill="#2A2B2C"/>`,
        )
        .join("")}
      <rect x="-14" y="10" width="${W + 28}" height="${H - 10}" fill="#000" opacity=".16"/>`;

  // shutter
  d += surface(0, 0, W, H);
  const st = Math.max(90, Math.min(150, W * 0.14));
  switch (c.style) {
    case "shaker":
      d += panel(st, st, W - 2 * st, H * 0.42 - st) + panel(st, H * 0.42 + st * 0.8, W - 2 * st, H - st * 1.4 - (H * 0.42 + st * 0.8));
      break;
    case "panel4": {
      const g = st * 0.8,
        cw = (W - 2 * st - g) / 2,
        y2 = H * 0.4 + st * 1.2;
      d +=
        panel(st, st, cw, H * 0.4 - st, true) +
        panel(st + cw + g, st, cw, H * 0.4 - st, true) +
        panel(st, y2, cw, H - st * 1.5 - y2, true) +
        panel(st + cw + g, y2, cw, H - st * 1.5 - y2, true);
      break;
    }
    case "grooved":
      for (let y = 300; y < H - 220; y += 170)
        d += `<rect x="0" y="${y}" width="${W}" height="7" fill="${dark}" opacity=".7"/><rect x="0" y="${y + 7}" width="${W}" height="4" fill="${light}" opacity=".6"/>`;
      break;
    case "glass": {
      const gx = c.swing === "R" ? W * 0.2 : W * 0.64,
        gw = W * 0.16;
      const gfill = c.glass === "fluted" ? `url(#fl${n})` : c.glass === "smoked" ? glass.fill : `url(#gl${n})`;
      d += `<rect x="${gx - 14}" y="206" width="${gw + 28}" height="${H - 412}" fill="${dark}" opacity=".6"/><rect x="${gx}" y="220" width="${gw}" height="${H - 440}" fill="${gfill}"/>
        ${
          c.glass === "clear" || c.glass === "smoked"
            ? `<path d="M${gx + gw * 0.15} ${220 + H * 0.2}L${gx + gw * 0.85} ${220 + H * 0.05}L${gx + gw * 0.85} ${220 + H * 0.1}L${gx + gw * 0.15} ${220 + H * 0.25}Z" fill="#fff" opacity=".22"/>`
            : ""
        }`;
      break;
    }
    case "louvre": {
      const sec = (y1: number, y2: number) => {
        let o = `<rect x="${st}" y="${y1}" width="${W - 2 * st}" height="${y2 - y1}" fill="${shade(base, -0.4)}"/>`;
        for (let y = y1 + 8; y < y2 - 24; y += 44)
          o += `<rect x="${st}" y="${y}" width="${W - 2 * st}" height="30" fill="${base}"/><rect x="${st}" y="${y}" width="${W - 2 * st}" height="6" fill="${light}" opacity=".7"/><rect x="${st}" y="${y + 26}" width="${W - 2 * st}" height="4" fill="${dark}" opacity=".35"/>`;
        return o;
      };
      d += sec(140, H * 0.46) + sec(H * 0.54, H - 170);
      break;
    }
    case "main": {
      const b = 90,
        pw = (W - 2 * b - 3 * 60) / 2,
        px1 = b + 60,
        px2 = b + 60 + pw + 60,
        y1 = b + 60,
        y2 = H * 0.53;
      d += `<rect x="${b}" y="${b}" width="${W - 2 * b}" height="${H - 2 * b}" fill="none" stroke="${dark}" stroke-width="12"/>`;
      const brass = getHardwareFinish("brass").hex;
      (
        [
          [px1, y1, H * 0.47 - y1],
          [px2, y1, H * 0.47 - y1],
          [px1, y2, H - b - 60 - y2],
          [px2, y2, H - b - 60 - y2],
        ] as const
      ).forEach(([x, y, h]) => {
        d += panel(x, y, pw, h, true);
        const cx = x + pw / 2,
          cy = y + h / 2,
          r = Math.min(pw, h) * 0.28;
        d += `<path d="M${cx} ${cy - r}L${cx + r * 0.7} ${cy}L${cx} ${cy + r}L${cx - r * 0.7} ${cy}Z" fill="${shade(base, -0.15)}" stroke="${light}" stroke-width="6"/><circle cx="${cx}" cy="${cy}" r="${r * 0.16}" fill="${brass}"/>`;
      });
      break;
    }
    case "pivot":
      for (let x = 150; x < W - 60; x += 150)
        d += `<rect x="${x}" y="0" width="8" height="${H}" fill="${dark}" opacity=".55"/><rect x="${x + 8}" y="0" width="4" height="${H}" fill="${light}" opacity=".5"/>`;
      break;
    case "barn": {
      for (let i = 1; i < 5; i++) d += `<rect x="${(W * i) / 5 - 3}" y="0" width="6" height="${H}" fill="${dark}" opacity=".45"/>`;
      const bnd = `fill="${shade(base, 0.06)}" stroke="${dark}" stroke-width="6"`;
      d += `<rect x="0" y="110" width="${W}" height="150" ${bnd}/><rect x="0" y="${H - 280}" width="${W}" height="150" ${bnd}/>
        <path d="M60 ${H - 280}L${W - 60 - 110} 260L${W - 60} 260L170 ${H - 280}Z" ${bnd}/>`;
      break;
    }
  }
  d += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#lg${n})"/><rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="6"/>`;

  // hardware
  const R = c.swing === "R",
    ex = R ? W - 80 : 80,
    hy = H - 1000,
    dir = R ? -1 : 1;
  const hwFill = `url(#hw${n})`;
  if (c.handle === "lever") {
    d += `<rect x="${ex - 18}" y="${hy - 84}" width="44" height="184" rx="22" fill="#000" opacity=".18"/><rect x="${ex - 22}" y="${hy - 92}" width="44" height="184" rx="22" fill="${hwFill}"/><rect x="${dir < 0 ? ex - 160 : ex}" y="${hy - 12}" width="160" height="32" rx="16" fill="#000" opacity=".2"/><rect x="${dir < 0 ? ex - 160 : ex}" y="${hy - 16}" width="160" height="32" rx="16" fill="${hwHex}"/><rect x="${dir < 0 ? ex - 160 : ex}" y="${hy - 16}" width="160" height="9" rx="4" fill="#fff" opacity=".3"/>`;
  } else if (c.handle === "knob") {
    d += `<circle cx="${ex + 5}" cy="${hy + 8}" r="52" fill="#000" opacity=".2"/><circle cx="${ex}" cy="${hy}" r="50" fill="${shade(hwHex, -0.25)}"/><circle cx="${ex}" cy="${hy}" r="36" fill="${hwFill}"/><circle cx="${ex - 10}" cy="${hy - 12}" r="10" fill="#fff" opacity=".4"/>`;
  } else if (c.handle === "flush") {
    d += `<rect x="${ex - 26}" y="${hy - 100}" width="52" height="200" rx="26" fill="${shade(base, -0.45)}" stroke="${hwHex}" stroke-width="8"/><rect x="${ex - 18}" y="${hy - 92}" width="36" height="40" rx="18" fill="#000" opacity=".25"/>`;
  } else {
    const len = c.style === "pivot" ? 1400 : 600;
    const off = c.style === "pivot" ? 190 : 170;
    const px = R ? W - off : off;
    d += `<rect x="${px - 6}" y="${hy - len / 2 + 14}" width="30" height="${len}" rx="15" fill="#000" opacity=".22"/><rect x="${px - 15}" y="${hy - len / 2}" width="30" height="${len}" rx="15" fill="${hwFill}"/><rect x="${px - 15}" y="${hy - len / 2}" width="9" height="${len}" rx="4" fill="#fff" opacity=".28"/>`;
  }
  if (c.lock === "smart")
    d += `<rect x="${ex - 40}" y="${hy - 400}" width="80" height="240" rx="16" fill="#151617"/><rect x="${ex - 26}" y="${hy - 376}" width="52" height="96" rx="8" fill="#2F5E78"/><rect x="${ex - 26}" y="${hy - 376}" width="52" height="30" rx="8" fill="#fff" opacity=".12"/><circle cx="${ex}" cy="${hy - 220}" r="18" fill="#3A3C3E"/>`;
  else if (c.lock === "mortise")
    d += `<rect x="${ex - 18}" y="${hy + 120}" width="36" height="110" rx="18" fill="${hwFill}"/><circle cx="${ex}" cy="${hy + 160}" r="9" fill="#111"/><rect x="${ex - 4}" y="${hy + 160}" width="8" height="34" fill="#111"/>`;
  else if (c.lock === "tubular" || c.lock === "privacy")
    d += `<circle cx="${ex}" cy="${hy + 130}" r="26" fill="${hwFill}"/><rect x="${ex - 4}" y="${hy + 114}" width="8" height="32" rx="3" fill="#111" opacity=".75"/>`;

  if (dims && mode === "scene") {
    const dy = top - 170,
      dx = W + O + 200;
    const ln = 'style="stroke:var(--scene-dim,#6E675C)"';
    const ink = 'style="fill:var(--scene-dim,#6E675C)"';
    d += `<g stroke-width="4" ${ln}>
      <line x1="0" y1="${-O - 30}" x2="0" y2="${dy - 40}" ${ln}/><line x1="${W}" y1="${-O - 30}" x2="${W}" y2="${dy - 40}" ${ln}/>
      <line x1="-40" y1="${dy}" x2="${W + 40}" y2="${dy}" ${ln}/><line x1="-26" y1="${dy + 26}" x2="26" y2="${dy - 26}" ${ln}/><line x1="${W - 26}" y1="${dy + 26}" x2="${W + 26}" y2="${dy - 26}" ${ln}/>
      <line x1="${W + O + 30}" y1="0" x2="${dx + 40}" y2="0" ${ln}/><line x1="${W + O + 30}" y1="${H}" x2="${dx + 40}" y2="${H}" ${ln}/>
      <line x1="${dx}" y1="-40" x2="${dx}" y2="${H + 40}" ${ln}/><line x1="${dx - 26}" y1="26" x2="${dx + 26}" y2="-26" ${ln}/><line x1="${dx - 26}" y1="${H + 26}" x2="${dx + 26}" y2="${H - 26}" ${ln}/></g>
      <text x="${W / 2}" y="${dy - 34}" text-anchor="middle" font-family="var(--font-sans), system-ui, sans-serif" font-size="70" letter-spacing="4" ${ink}>${W} mm · ${feetInches(W)}</text>
      <text transform="translate(${dx + 92} ${H / 2}) rotate(-90)" text-anchor="middle" font-family="var(--font-sans), system-ui, sans-serif" font-size="70" letter-spacing="4" ${ink}>${H} mm · ${feetInches(H)}</text>`;
  }

  const label = opts.label ?? `${s.name} door, ${col.label}`;
  const a11y = decorative ? 'aria-hidden="true" focusable="false"' : `role="img" aria-label="${esc(label)}"`;
  const svg = `<svg viewBox="${vb.join(" ")}" overflow="hidden" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" ${a11y}>${defs}${d}</svg>`;
  return { svg, viewBox: vb };
}
