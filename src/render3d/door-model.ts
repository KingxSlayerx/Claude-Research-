/**
 * Builds a 3D model of a configured door, constructed the way the real door
 * is: stiles and rails around recessed or raised panels, V-grooves, louvre
 * slats, glass lights and real hardware. Units are metres; the floor is y = 0
 * and the face of the wall is z = 0.
 *
 * Geometry per style follows the 2D drawings (src/render/door-svg.ts) so the
 * illustration and the 3D view always agree.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { getStyle } from "@/domain/catalog";
import type { DoorConfig } from "@/domain/config";
import { buildMaterials, disposeMaterials } from "./materials";

const MM = 0.001;

/** Front-view planar UVs in metres, so wood grain is continuous across every part. */
function planarUV(g: THREE.BufferGeometry) {
  const pos = g.getAttribute("position");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / 0.5;
    uv[i * 2 + 1] = pos.getY(i) / 2.0;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DoorModel {
  root: THREE.Group;
  /** Rotate to open: 0 closed … 1 open (≈ 80°). */
  setOpen(t: number): void;
  /** Overall bounds of door + frame, for camera framing. */
  bounds: { width: number; height: number; top: number };
  dispose(): void;
}

export function buildDoor(c: DoorConfig): DoorModel {
  const s = getStyle(c.style);
  const W = c.w * MM;
  const H = c.h * MM;
  const T = c.thick * MM;
  const mats = buildMaterials(c);
  const geos: THREE.BufferGeometry[] = [];
  const root = new THREE.Group();
  const leaf = new THREE.Group();
  const hingeLeft = c.swing === "R";
  const pivot = new THREE.Group();
  pivot.position.set(hingeLeft ? 0 : W, 0, 0);
  leaf.position.set(hingeLeft ? 0 : -W, 0, 0);
  pivot.add(leaf);
  root.add(pivot);

  const add = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D = leaf, uv = true) => {
    if (uv) planarUV(g);
    geos.push(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const rbox = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, r = 1.5 * MM, parent?: THREE.Object3D) => {
    const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
    g.translate(x + w / 2, y + h / 2, z);
    return add(g, m, parent);
  };

  // Convert a 2D drawing rect (mm, y measured from the top) to leaf space (m, y from floor).
  const r2 = (x: number, yTop: number, w: number, h: number): Rect => ({ x: x * MM, y: (c.h - yTop - h) * MM, w: w * MM, h: h * MM });

  /** Leaf with rectangular openings (for panels, glass, louvres), extruded to full thickness. */
  const frameWithHoles = (holes: Rect[]) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0).lineTo(W, 0).lineTo(W, H).lineTo(0, H).lineTo(0, 0);
    for (const h of holes) {
      const p = new THREE.Path();
      p.moveTo(h.x, h.y).lineTo(h.x, h.y + h.h).lineTo(h.x + h.w, h.y + h.h).lineTo(h.x + h.w, h.y).lineTo(h.x, h.y);
      shape.holes.push(p);
    }
    const bev = 1.5 * MM;
    const g = new THREE.ExtrudeGeometry(shape, { depth: T - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 1 });
    g.translate(0, 0, -(T - 2 * bev) / 2);
    add(g, mats.surface);
  };

  /** Flat recessed panel, set back from both faces. */
  const recessedPanel = (h: Rect) => {
    const d = T * 0.42;
    rbox(h.w, h.h, d, h.x, h.y, 0, mats.recess, 3 * MM);
  };

  /** Raised panel: thin centre board with a bevelled field on each face. */
  const raisedPanel = (h: Rect, field = 0.62) => {
    rbox(h.w, h.h, T * 0.45, h.x, h.y, 0, mats.surface, 2 * MM);
    const inset = Math.min(h.w, h.h) * (1 - field) * 0.5;
    const fw = h.w - inset * 2;
    const fh = h.h - inset * 2;
    for (const side of [1, -1]) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0).lineTo(fw, 0).lineTo(fw, fh).lineTo(0, fh).lineTo(0, 0);
      const bevelSize = Math.min(inset * 0.9, 28 * MM);
      const g = new THREE.ExtrudeGeometry(shape, { depth: 1 * MM, bevelEnabled: true, bevelThickness: T * 0.22, bevelSize, bevelSegments: 1, curveSegments: 1 });
      if (side < 0) g.rotateY(Math.PI);
      g.translate(side > 0 ? h.x + inset : h.x + inset + fw, h.y + inset, side * T * 0.2);
      add(g, mats.surface);
    }
  };

  /** A cut line across one face: dark groove with a lit lower lip. */
  const groove = (x: number, y: number, w: number, h: number, vertical = false) => {
    for (const side of [1, -1]) {
      const z = side * (T / 2 + 0.2 * MM);
      const g1 = new THREE.PlaneGeometry(w, h);
      if (side < 0) g1.rotateY(Math.PI);
      g1.translate(x + w / 2, y + h / 2, z);
      add(g1, mats.groove);
      const lip = vertical ? new THREE.PlaneGeometry(2.5 * MM, h) : new THREE.PlaneGeometry(w, 2.5 * MM);
      if (side < 0) lip.rotateY(Math.PI);
      lip.translate(vertical ? x + w + 1.25 * MM : x + w / 2, vertical ? y + h / 2 : y - 1.25 * MM, z + 0.1 * MM);
      const lipMat = mats.surface.clone();
      lipMat.emissive = new THREE.Color(0xffffff);
      lipMat.emissiveIntensity = 0.06;
      add(lip, lipMat);
    }
  };

  const st = Math.max(90, Math.min(150, c.w * 0.14));

  switch (c.style) {
    case "flush":
      rbox(W, H, T, 0, 0, 0, mats.surface);
      break;
    case "shaker": {
      const p1 = r2(st, st, c.w - 2 * st, c.h * 0.42 - st);
      const y2 = c.h * 0.42 + st * 0.8;
      const p2 = r2(st, y2, c.w - 2 * st, c.h - st * 1.4 - y2);
      frameWithHoles([p1, p2]);
      recessedPanel(p1);
      recessedPanel(p2);
      break;
    }
    case "panel4": {
      const g = st * 0.8,
        cw = (c.w - 2 * st - g) / 2,
        y2 = c.h * 0.4 + st * 1.2;
      const ps = [
        r2(st, st, cw, c.h * 0.4 - st),
        r2(st + cw + g, st, cw, c.h * 0.4 - st),
        r2(st, y2, cw, c.h - st * 1.5 - y2),
        r2(st + cw + g, y2, cw, c.h - st * 1.5 - y2),
      ];
      frameWithHoles(ps);
      ps.forEach((p) => raisedPanel(p));
      break;
    }
    case "main": {
      const b = 90,
        pw = (c.w - 2 * b - 3 * 60) / 2,
        px1 = b + 60,
        px2 = b + 60 + pw + 60,
        y1 = b + 60,
        y2 = c.h * 0.53;
      const ps = [
        r2(px1, y1, pw, c.h * 0.47 - y1),
        r2(px2, y1, pw, c.h * 0.47 - y1),
        r2(px1, y2, pw, c.h - b - 60 - y2),
        r2(px2, y2, pw, c.h - b - 60 - y2),
      ];
      frameWithHoles(ps);
      ps.forEach((p) => {
        raisedPanel(p, 0.7);
        const cx = p.x + p.w / 2,
          cy = p.y + p.h / 2,
          r = Math.min(p.w, p.h) * 0.24;
        for (const side of [1, -1]) {
          const d = new THREE.Shape();
          d.moveTo(0, -r).lineTo(r * 0.7, 0).lineTo(0, r).lineTo(-r * 0.7, 0).lineTo(0, -r);
          const g = new THREE.ExtrudeGeometry(d, { depth: 1 * MM, bevelEnabled: true, bevelThickness: 7 * MM, bevelSize: 10 * MM, bevelSegments: 1 });
          if (side < 0) g.rotateY(Math.PI);
          g.translate(cx, cy, side * (T * 0.2 + T * 0.22));
          add(g, mats.surface);
          const stud = new THREE.SphereGeometry(r * 0.13, 20, 12);
          stud.scale(1, 1, 0.5);
          stud.translate(cx, cy, side * (T * 0.42 + 9 * MM));
          add(stud, mats.accentBrass, leaf, false);
        }
      });
      // carved border bead
      const bead = 12 * MM;
      for (const [x, y, w, h] of [
        [b * MM, b * MM, (c.w - 2 * b) * MM, bead],
        [b * MM, H - b * MM - bead, (c.w - 2 * b) * MM, bead],
        [b * MM, b * MM, bead, H - 2 * b * MM],
        [W - b * MM - bead, b * MM, bead, H - 2 * b * MM],
      ])
        groove(x, y, w, h, h > w);
      break;
    }
    case "grooved":
      rbox(W, H, T, 0, 0, 0, mats.surface);
      for (let y = 300; y < c.h - 220; y += 170) groove(0, (c.h - y - 7) * MM, W, 7 * MM);
      break;
    case "pivot":
      rbox(W, H, T, 0, 0, 0, mats.surface);
      for (let x = 150; x < c.w - 60; x += 150) groove(x * MM, 0, 8 * MM, H, true);
      break;
    case "glass": {
      const gx = c.swing === "R" ? c.w * 0.2 : c.w * 0.64,
        gw = c.w * 0.16;
      const hole = r2(gx - 14, 206, gw + 28, c.h - 412);
      frameWithHoles([hole]);
      const pane = new THREE.BoxGeometry(hole.w, hole.h, 6 * MM);
      pane.translate(hole.x + hole.w / 2, hole.y + hole.h / 2, 0);
      add(pane, mats.glass);
      // glazing beads
      const bw = 14 * MM;
      for (const side of [1, -1])
        for (const [x, y, w, h] of [
          [hole.x, hole.y, bw, hole.h],
          [hole.x + hole.w - bw, hole.y, bw, hole.h],
          [hole.x, hole.y, hole.w, bw],
          [hole.x, hole.y + hole.h - bw, hole.w, bw],
        ])
          rbox(w, h, T * 0.3, x, y, side * T * 0.2, mats.groove, 2 * MM);
      break;
    }
    case "louvre": {
      const sec = [r2(st, 140, c.w - 2 * st, c.h * 0.46 - 140), r2(st, c.h * 0.54, c.w - 2 * st, c.h - 170 - c.h * 0.54)];
      frameWithHoles(sec);
      for (const r of sec) {
        for (let y = r.y + r.h - 30 * MM; y > r.y + 8 * MM; y -= 44 * MM) {
          const g = new RoundedBoxGeometry(r.w, 52 * MM, 8 * MM, 2, 2 * MM);
          g.rotateX(-0.75);
          g.translate(r.x + r.w / 2, y, 0);
          add(g, mats.surface);
        }
      }
      break;
    }
    case "barn": {
      rbox(W, H, T, 0, 0, 0, mats.surface);
      for (let i = 1; i < 5; i++) groove((c.w * i) / 5 * MM - 3 * MM, 0, 6 * MM, H, true);
      const rail = 20 * MM;
      for (const side of [1, -1]) {
        const z = side * (T / 2 + rail / 2);
        rbox(W, 150 * MM, rail, 0, (c.h - 260) * MM, z, mats.surface, 3 * MM);
        rbox(W, 150 * MM, rail, 0, 130 * MM, z, mats.surface, 3 * MM);
        // diagonal brace from bottom-left to top-right between the rails
        const x1 = 60 * MM,
          y1 = 280 * MM,
          x2 = W - 60 * MM,
          y2 = H - 260 * MM;
        const len = Math.hypot(x2 - x1, y2 - y1);
        const g = new RoundedBoxGeometry(110 * MM, len, rail, 2, 3 * MM);
        g.rotateZ(-Math.atan2(x2 - x1, y2 - y1));
        g.translate((x1 + x2) / 2, (y1 + y2) / 2, z);
        add(g, mats.surface);
      }
      break;
    }
  }

  /* ---------- hardware ---------- */
  const handleX = (hingeLeft ? c.w - 80 : 80) * MM;
  const handleY = 1000 * MM;
  const towardFree = hingeLeft ? -1 : 1; // lever points toward the hinge side
  const hwOn = (side: 1 | -1, build: (z: number, side: 1 | -1) => void) => build(side * T / 2, side);

  for (const side of [1, -1] as const) {
    hwOn(side, (z) => {
      const out = side;
      if (c.handle === "lever") {
        const rose = new THREE.CylinderGeometry(27 * MM, 27 * MM, 9 * MM, 40);
        rose.rotateX(Math.PI / 2);
        rose.translate(handleX, handleY, z + out * 4.5 * MM);
        add(rose, mats.metal, leaf, false);
        const neck = new THREE.CylinderGeometry(9 * MM, 9 * MM, 50 * MM, 24);
        neck.rotateX(Math.PI / 2);
        neck.translate(handleX, handleY, z + out * 30 * MM);
        add(neck, mats.metal, leaf, false);
        const lever = new RoundedBoxGeometry(140 * MM, 18 * MM, 18 * MM, 3, 8 * MM);
        lever.translate(handleX + towardFree * 62 * MM, handleY, z + out * 55 * MM);
        add(lever, mats.metal, leaf, false);
      } else if (c.handle === "knob") {
        const rose = new THREE.CylinderGeometry(30 * MM, 30 * MM, 9 * MM, 40);
        rose.rotateX(Math.PI / 2);
        rose.translate(handleX, handleY, z + out * 4.5 * MM);
        add(rose, mats.metal, leaf, false);
        const neck = new THREE.CylinderGeometry(10 * MM, 14 * MM, 30 * MM, 24);
        neck.rotateX(Math.PI / 2);
        neck.translate(handleX, handleY, z + out * 22 * MM);
        add(neck, mats.metal, leaf, false);
        const knob = new THREE.SphereGeometry(30 * MM, 40, 24);
        knob.scale(1, 1, 0.75);
        knob.translate(handleX, handleY, z + out * 52 * MM);
        add(knob, mats.metal, leaf, false);
      } else if (c.handle === "pull") {
        const len = (c.style === "pivot" ? 1400 : 600) * MM;
        const off = (c.style === "pivot" ? 190 : 170) * MM;
        const px = hingeLeft ? W - off : off;
        const bar = new THREE.CylinderGeometry(15 * MM, 15 * MM, len, 32);
        bar.translate(px, handleY, z + out * 62 * MM);
        add(bar, mats.metal, leaf, false);
        for (const dy of [-len / 2 + 60 * MM, len / 2 - 60 * MM]) {
          const st2 = new THREE.CylinderGeometry(9 * MM, 9 * MM, 62 * MM, 20);
          st2.rotateX(Math.PI / 2);
          st2.translate(px, handleY + dy, z + out * 31 * MM);
          add(st2, mats.metal, leaf, false);
        }
      } else {
        const ring = new RoundedBoxGeometry(56 * MM, 200 * MM, 4 * MM, 3, 2 * MM);
        ring.translate(handleX, handleY, z + out * 1 * MM);
        add(ring, mats.metal, leaf, false);
        const well = new RoundedBoxGeometry(42 * MM, 186 * MM, 4 * MM, 3, 2 * MM);
        well.translate(handleX, handleY, z + out * 2 * MM);
        add(well, mats.rubber, leaf, false);
      }

      if (c.lock === "smart") {
        const body = new RoundedBoxGeometry(78 * MM, 240 * MM, 24 * MM, 4, 10 * MM);
        body.translate(handleX, handleY + 280 * MM, z + out * 12 * MM);
        add(body, mats.rubber, leaf, false);
        if (side > 0) {
          const scr = new RoundedBoxGeometry(52 * MM, 96 * MM, 2 * MM, 3, 1 * MM);
          scr.translate(handleX, handleY + 320 * MM, z + 24.5 * MM);
          add(scr, mats.screen, leaf, false);
        }
      } else if (c.lock === "mortise") {
        const plate = new RoundedBoxGeometry(36 * MM, 110 * MM, 5 * MM, 3, 2 * MM);
        plate.translate(handleX, handleY - 175 * MM, z + out * 2.5 * MM);
        add(plate, mats.metal, leaf, false);
        const hole = new THREE.CylinderGeometry(6 * MM, 6 * MM, 2 * MM, 16);
        hole.rotateX(Math.PI / 2);
        hole.translate(handleX, handleY - 160 * MM, z + out * 5.5 * MM);
        add(hole, mats.rubber, leaf, false);
      } else if (c.lock === "tubular" || c.lock === "privacy") {
        const esc = new THREE.CylinderGeometry(24 * MM, 24 * MM, 6 * MM, 32);
        esc.rotateX(Math.PI / 2);
        esc.translate(handleX, handleY - 130 * MM, z + out * 3 * MM);
        add(esc, mats.metal, leaf, false);
        const slot = new RoundedBoxGeometry(7 * MM, 28 * MM, 2 * MM, 2, 1 * MM);
        slot.translate(handleX, handleY - 130 * MM, z + out * 6.5 * MM);
        add(slot, mats.rubber, leaf, false);
      }
    });
  }

  // visible hinges on the hinge edge
  if (!s.noFrame) {
    for (const y of [0.22, H / 2, H - 0.22]) {
      const k = new THREE.CylinderGeometry(7 * MM, 7 * MM, 100 * MM, 16);
      k.translate(hingeLeft ? -1 * MM : W + 1 * MM, y, T / 2 - 4 * MM);
      add(k, mats.metal, leaf, false);
    }
  }

  /* ---------- frame, architrave, track ---------- */
  const F = s.noFrame || c.frame === "none" ? 0 : 55 * MM;
  const A = !s.noFrame && c.arch ? 75 * MM : 0;
  const frameDepth = 140 * MM;
  if (F) {
    const z = -frameDepth / 2 + 12 * MM;
    rbox(F, H + F, frameDepth, -F, 0, z, mats.frame, 2 * MM, root);
    rbox(F, H + F, frameDepth, W, 0, z, mats.frame, 2 * MM, root);
    rbox(W, F, frameDepth, 0, H, z, mats.frame, 2 * MM, root);
    // door stop
    rbox(12 * MM, H, 30 * MM, -2 * MM, 0, -T / 2 - 15 * MM, mats.frame, 2 * MM, root);
    rbox(12 * MM, H, 30 * MM, W - 10 * MM, 0, -T / 2 - 15 * MM, mats.frame, 2 * MM, root);
  }
  if (A) {
    const z = 12 * MM + 9 * MM;
    rbox(A, H + F + A, 18 * MM, -F - A, 0, z, mats.frame, 4 * MM, root);
    rbox(A, H + F + A, 18 * MM, W + F, 0, z, mats.frame, 4 * MM, root);
    rbox(W + 2 * F + 2 * A, A, 18 * MM, -F - A, H + F, z, mats.frame, 4 * MM, root);
  }
  if (c.style === "barn") {
    // Barn doors hang on the wall face, in front of the opening.
    pivot.position.z = T / 2 + 30 * MM;
    const trackY = H + 150 * MM;
    const track = new RoundedBoxGeometry(W * 2.05, 34 * MM, 12 * MM, 2, 4 * MM);
    track.translate(hingeLeft ? W * 0.5 : W * 0.5, trackY, 20 * MM);
    add(track, mats.rubber, root, false);
    for (const fx of [0.2, 0.8]) {
      const wheel = new THREE.CylinderGeometry(44 * MM, 44 * MM, 16 * MM, 32);
      wheel.rotateX(Math.PI / 2);
      wheel.translate(W * fx, trackY - 10 * MM, 0);
      add(wheel, mats.rubber, leaf, false);
      const strap = new RoundedBoxGeometry(28 * MM, 190 * MM, 8 * MM, 2, 2 * MM);
      strap.translate(W * fx, H + 40 * MM, T / 2 + 4 * MM);
      add(strap, mats.rubber, leaf, false);
    }
  }

  const frameOuter = F + A;
  return {
    root,
    bounds: { width: W + 2 * frameOuter + (c.style === "barn" ? W : 0), height: H + frameOuter + (c.style === "barn" ? 0.2 : 0), top: H + frameOuter },
    setOpen(t: number) {
      const k = Math.max(0, Math.min(1, t));
      if (c.style === "barn") {
        leaf.position.x = (hingeLeft ? 0 : -W) - k * W * 0.92 * (hingeLeft ? 1 : -1);
        return;
      }
      const ang = k * 1.38;
      pivot.rotation.y = hingeLeft ? ang : -ang;
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      disposeMaterials(mats);
    },
  };
}
