/**
 * A lit 3D stage for the door: wall with an opening, floor, a warm room
 * beyond, studio lighting and soft shadows. Renders on demand only (no idle
 * animation loop) and is safe to create and dispose repeatedly.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { getStyle } from "@/domain/catalog";
import type { DoorConfig } from "@/domain/config";
import { buildDoor, type DoorModel } from "./door-model";
import { floorMaterial, plasterMaterial } from "./materials";

export type StageMode = "hero" | "studio" | "product";

export interface StageOptions {
  mode: StageMode;
  /** Allow drag-to-rotate (studio). */
  orbit?: boolean;
  /** Preserve the drawing buffer so the canvas can be exported. */
  preserveDrawingBuffer?: boolean;
  pixelRatio?: number;
}

const PALETTES: Record<StageMode, { wall: string; floor: string; bg: string; beyond: string; exposure: number }> = {
  hero: { wall: "#6f665c", floor: "#2c2824", bg: "#0e0c0a", beyond: "#ffcf8f", exposure: 1.0 },
  studio: { wall: "#e4e0da", floor: "#bfb6a9", bg: "#f2efea", beyond: "#fff1dc", exposure: 0.9 },
  product: { wall: "#e4e0da", floor: "#bfb6a9", bg: "#f2efea", beyond: "#fff1dc", exposure: 0.9 },
};

/** Light cookie: sunlight through a jaali screen. */
function jaaliCookie(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 512, 512);
  ctx.filter = "blur(3px)";
  ctx.fillStyle = "#fff";
  const cell = 28;
  for (let y = -cell; y < 512 + cell; y += cell)
    for (let x = -cell; x < 512 + cell; x += cell) {
      const ox = ((y / cell) % 2) * (cell / 2);
      ctx.beginPath();
      ctx.moveTo(x + ox, y - 11);
      ctx.lineTo(x + ox + 11, y);
      ctx.lineTo(x + ox, y + 11);
      ctx.lineTo(x + ox - 11, y);
      ctx.closePath();
      ctx.fill();
    }
  // soft vignette so the pattern fades at the edge of the beam
  ctx.filter = "none";
  const g = ctx.createRadialGradient(230, 250, 40, 256, 256, 250);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Soft contact shadow texture (dark centre fading out), multiplied onto the floor. */
function contactShadow(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.35, "rgba(0,0,0,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 64);
  return new THREE.CanvasTexture(c);
}

export interface ViewOverride {
  /** Point to look at, in metres (door space: x across, y up, z out of the wall). */
  target: [number, number, number];
  distance: number;
  /** Radians; positive looks from the right. */
  azimuth?: number;
  /** Radians above horizontal. */
  elevation?: number;
  fov?: number;
}

export interface DoorStage {
  setView(v: ViewOverride | null): void;
  setConfig(c: DoorConfig): void;
  /** 0 = closed, 1 = open. Animates unless `instant`. */
  setOpen(t: number, instant?: boolean): void;
  /** Camera dolly for scroll scenes: 0 = framed, 1 = closer. */
  setDolly(t: number): void;
  resize(): void;
  render(): void;
  resetView(): void;
  dispose(): void;
  readonly canvas: HTMLCanvasElement;
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function createStage(canvas: HTMLCanvasElement, opts: StageOptions): DoorStage {
  const pal = PALETTES[opts.mode];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: !!opts.preserveDrawingBuffer, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(opts.pixelRatio ?? window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = opts.mode === "hero" ? THREE.ACESFilmicToneMapping : THREE.NeutralToneMapping;
  renderer.toneMappingExposure = pal.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(pal.bg);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = opts.mode === "hero" ? 0.12 : 0.42;

  const camera = new THREE.PerspectiveCamera(opts.mode === "hero" ? 32 : 26, 1, 0.05, 60);

  /* lights */
  const hero = opts.mode === "hero";
  const hemi = new THREE.HemisphereLight(0xf8f4ee, 0x2a241f, hero ? 0.12 : 0.35);
  scene.add(hemi);
  // Key: a spot that rakes across the wall. In the hero it projects jaali sunlight.
  const key = new THREE.SpotLight(hero ? 0xffdcae : 0xfff5ea, hero ? 150 : 30, 0, hero ? 0.34 : 0.5, hero ? 0.35 : 1, 1.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.015;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 14;
  if (hero) key.map = jaaliCookie();
  scene.add(key);
  scene.add(key.target);
  const fill = new THREE.DirectionalLight(0xf6f3ee, hero ? 0.18 : 0.55);
  fill.position.set(1.5, 2.2, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xdfe8ff, hero ? 0.12 : 0.35);
  rim.position.set(3, 2, 2.5);
  scene.add(rim);
  const beyondLight = new THREE.PointLight(new THREE.Color(pal.beyond), 0, 7, 1.4);
  scene.add(beyondLight);
  const shadowTex = contactShadow();
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true, color: 0xffffff });
  const shadowMatBasic = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, color: 0x000000, alphaMap: shadowTex, opacity: hero ? 0.9 : 0.7 });
  void shadowMat;

  /* static set */
  const wallMat = plasterMaterial(pal.wall);
  const floorMat = floorMaterial(pal.floor);
  const beyondMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(pal.beyond), emissive: new THREE.Color(pal.beyond), emissiveIntensity: opts.mode === "hero" ? 1.4 : 0.9 });
  const set = new THREE.Group();
  scene.add(set);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  let model: DoorModel | null = null;
  let cfg: DoorConfig | null = null;
  let openTarget = 0;
  let openNow = 0;
  let dolly = 0;
  let view: ViewOverride | null = null;
  let raf = 0;
  let disposed = false;
  const baseTarget = new THREE.Vector3();
  const basePos = new THREE.Vector3();

  const controls = opts.orbit ? new OrbitControls(camera, canvas) : null;
  if (controls) {
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.55;
    controls.minAzimuthAngle = -0.95;
    controls.maxAzimuthAngle = 0.95;
    controls.minPolarAngle = 1.05;
    controls.maxPolarAngle = 1.62;
    controls.addEventListener("change", () => requestRender());
  }

  function buildSet(c: DoorConfig) {
    set.children.forEach((o) => (o as THREE.Mesh).geometry?.dispose());
    set.clear();
    const s = getStyle(c.style);
    const W = c.w / 1000;
    const H = c.h / 1000;
    const F = s.noFrame || c.frame === "none" ? 0 : 0.055;
    const ow = W + 2 * F;
    const oh = H + F;
    const wallT = 0.15;
    const span = 14;
    const x0 = -F;
    const wallH = 14;
    // One continuous wall with a cut-out, so there are no seams around the opening.
    const shape = new THREE.Shape();
    shape.moveTo(x0 - span, 0).lineTo(x0, 0).lineTo(x0, oh).lineTo(x0 + ow, oh).lineTo(x0 + ow, 0).lineTo(x0 + ow + span, 0).lineTo(x0 + ow + span, wallH).lineTo(x0 - span, wallH).lineTo(x0 - span, 0);
    const wallGeo = new THREE.ExtrudeGeometry(shape, { depth: wallT, bevelEnabled: false });
    wallGeo.translate(0, 0, -wallT);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.receiveShadow = true;
    wall.castShadow = true;
    set.add(wall);
    // skirting
    const sk = new THREE.MeshStandardMaterial({ color: new THREE.Color(pal.wall).multiplyScalar(1.04), roughness: 0.7 });
    for (const [x, w] of [
      [x0 - span, span],
      [x0 + ow, span],
    ]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, 0.015), sk);
      m.position.set(x + w / 2, 0.045, 0.0075);
      m.receiveShadow = true;
      set.add(m);
    }
    // contact shadow along the base of the wall
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(span * 2, 0.32), shadowMatBasic);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(W / 2, 0.002, 0.16);
    set.add(strip);
    // the room beyond: floor and a glowing back wall
    const back = new THREE.Mesh(new THREE.PlaneGeometry(8, 14), beyondMat);
    back.position.set(W / 2, 7, -3.2);
    set.add(back);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 14), wallMat);
    side.rotation.y = Math.PI / 2;
    side.position.set(x0 - 0.6, 7, -1.75);
    set.add(side);
    beyondLight.position.set(W / 2, H * 0.6, -1.2);
  }

  function frame(c: DoorConfig) {
    const b = model!.bounds;
    if (view) {
      camera.fov = view.fov ?? camera.fov;
      camera.updateProjectionMatrix();
      const az = view.azimuth ?? 0;
      const el = view.elevation ?? 0;
      baseTarget.set(...view.target);
      basePos.set(
        baseTarget.x + view.distance * Math.sin(az) * Math.cos(el),
        baseTarget.y + view.distance * Math.sin(el),
        baseTarget.z + view.distance * Math.cos(az) * Math.cos(el),
      );
      camera.position.copy(basePos);
      camera.lookAt(baseTarget);
      key.position.set(c.w / 2000 - 1.2, b.top + 2.4, 3.6);
      key.target.position.set(...view.target);
      return;
    }
    const W = c.w / 1000;
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const hero = opts.mode === "hero";
    const portrait = aspect < 0.9;
    const needH = b.top * (hero ? (portrait ? 3.3 : 2.5) : opts.mode === "product" ? 1.42 : 1.26);
    const needW = b.width * (hero ? (portrait ? 1.2 : 2.6) : 1.7);
    const distH = needH / 2 / Math.tan(fov / 2);
    const distW = needW / 2 / Math.tan(fov / 2) / aspect;
    const dist = Math.max(distH, distW);
    // Hero: aim above the door so it sits in the lower half, under the headline.
    baseTarget.set(c.style === "barn" ? W * 0.5 : W / 2, b.top * (hero ? (portrait ? 1.56 : 1.08) : opts.mode === "product" ? 0.52 : 0.49), 0);
    basePos.set(baseTarget.x + (hero ? 0 : dist * 0.18), baseTarget.y + (hero ? -0.1 : 0.05), dist);
    camera.position.copy(basePos);
    camera.lookAt(baseTarget);
    if (opts.mode === "hero") {
      key.position.set(W / 2 - 3.4, b.top + 2.4, 3.2);
      key.target.position.set(W / 2 - 0.1, b.top * 0.5, 0);
    } else {
      key.position.set(W / 2 - 1.2, b.top + 2.4, 3.6);
      key.target.position.set(W / 2, b.top * 0.45, 0);
    }
    if (controls) {
      controls.target.copy(baseTarget);
      controls.update();
    }
  }

  function applyDolly() {
    if (!cfg) return;
    const k = dolly;
    const pos = basePos.clone().lerp(new THREE.Vector3(baseTarget.x, baseTarget.y, basePos.z * 0.55), k);
    camera.position.copy(pos);
    camera.lookAt(baseTarget);
  }

  function updateBeyond() {
    beyondLight.intensity = openNow * (opts.mode === "hero" ? 9 : 3);
  }

  function renderNow() {
    raf = 0;
    if (disposed) return;
    let again = false;
    if (Math.abs(openNow - openTarget) > 0.001) {
      openNow += (openTarget - openNow) * 0.12;
      if (Math.abs(openNow - openTarget) <= 0.001) openNow = openTarget;
      model?.setOpen(easeInOut(openNow));
      updateBeyond();
      again = true;
    }
    if (controls) again = controls.update() || again;
    renderer.render(scene, camera);
    if (again) requestRender();
  }

  function requestRender() {
    if (!raf && !disposed) raf = requestAnimationFrame(renderNow);
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (cfg && model) {
      frame(cfg);
      applyDolly();
    }
    requestRender();
  }

  return {
    canvas,
    setConfig(c) {
      const sameShape = cfg && cfg.w === c.w && cfg.h === c.h && cfg.style === c.style && cfg.frame === c.frame && cfg.arch === c.arch;
      cfg = c;
      if (model) {
        scene.remove(model.root);
        model.dispose();
      }
      model = buildDoor(c);
      scene.add(model.root);
      model.setOpen(easeInOut(openNow));
      buildSet(c);
      if (!sameShape) frame(c);
      applyDolly();
      requestRender();
    },
    setOpen(t, instant) {
      openTarget = Math.max(0, Math.min(1, t));
      if (instant) {
        openNow = openTarget;
        model?.setOpen(easeInOut(openNow));
        updateBeyond();
      }
      requestRender();
    },
    setDolly(t) {
      dolly = Math.max(0, Math.min(1, t));
      applyDolly();
      requestRender();
    },
    setView(v) {
      view = v;
      if (cfg && model) {
        frame(cfg);
        applyDolly();
      }
      requestRender();
    },
    resetView() {
      if (cfg) frame(cfg);
      requestRender();
    },
    resize,
    render: () => renderNow(),
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      controls?.dispose();
      model?.dispose();
      set.children.forEach((o) => (o as THREE.Mesh).geometry?.dispose());
      floor.geometry.dispose();
      wallMat.dispose();
      floorMat.dispose();
      beyondMat.dispose();
      shadowMatBasic.dispose();
      shadowTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
