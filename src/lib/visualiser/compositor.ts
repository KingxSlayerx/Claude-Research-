/**
 * Visualiser rendering boundary.
 *
 * Today the visualiser overlays an illustration of the configured door on
 * the customer's photo, entirely in the browser (`OverlayCompositor`). The
 * photo never leaves the device.
 *
 * A future server-side renderer (for example perspective matching or a
 * generative model) can implement `DoorCompositor` and be swapped in by the
 * visualiser page. Any such service would upload the photo, so it must be
 * opt-in and the on-page privacy copy must change with it.
 */
import type { DoorConfig } from "@/domain/config";
import { renderDoorSvg } from "@/render/door-svg";

export interface Placement {
  /** Centre of the door box, as % of the stage width / height. */
  x: number;
  y: number;
  /** Door box height as % of the stage height. */
  h: number;
}

export interface CompositeInput {
  image: HTMLImageElement;
  door: DoorConfig;
  placement: Placement;
}

export interface DoorCompositor {
  readonly id: string;
  /** True if the photo is processed on the customer's device only. */
  readonly onDevice: boolean;
  render(input: CompositeInput): Promise<Blob>;
}

export function doorAspect(door: DoorConfig): number {
  const [, , w, h] = renderDoorSvg(door, { mode: "bare" }).viewBox;
  return w / h;
}

export const OverlayCompositor: DoorCompositor = {
  id: "overlay",
  onDevice: true,
  async render({ image, door, placement }) {
    const W = image.naturalWidth;
    const H = image.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    ctx.drawImage(image, 0, 0, W, H);

    const { svg, viewBox } = renderDoorSvg(door, { mode: "bare", idPrefix: "cmp" });
    const boxH = (placement.h / 100) * H;
    const boxW = boxH * (viewBox[2] / viewBox[3]);
    const left = (placement.x / 100) * W - boxW / 2;
    const top = (placement.y / 100) * H - boxH / 2;
    const sized = svg.replace("<svg ", `<svg width="${Math.round(boxW)}" height="${Math.round(boxH)}" `);
    const url = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
    try {
      const doorImg = await loadImage(url);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.28)";
      ctx.shadowBlur = boxH * 0.03;
      ctx.shadowOffsetY = boxH * 0.012;
      ctx.drawImage(doorImg, left, top, boxW, boxH);
      ctx.restore();
    } finally {
      URL.revokeObjectURL(url);
    }
    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/jpeg", 0.9));
  },
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 2400;

export type PreparedPhoto = { url: string; width: number; height: number };

/**
 * Decodes and downsizes a photo on the device. Returns an object URL the
 * caller must revoke. Throws an Error with a customer-facing message.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image. Choose a JPG, PNG or WebP photo.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("That photo is larger than 25 MB. Choose a smaller one.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const heic = /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    throw new Error(
      heic
        ? "This browser can't open HEIC photos. On iPhone, choose “Most Compatible” in Camera settings, or share the photo as a JPG."
        : "We couldn't open that photo. Try a JPG or PNG.",
    );
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't prepare the photo.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  if (!blob) throw new Error("Your browser couldn't prepare the photo.");
  return { url: URL.createObjectURL(blob), width: w, height: h };
}
