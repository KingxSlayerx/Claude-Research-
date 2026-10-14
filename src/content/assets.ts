/**
 * Image manifest. Every image slot on the site is listed here with its
 * status and the brief for the photograph that should replace it.
 * `npm run assets:check` lists the slots still using placeholders.
 */
import { getStyle, type StyleId } from "@/domain/catalog";

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  /**
   * placeholder — temporary illustration; must be replaced.
   * render — computer-generated image of the real configuration (from `npm run renders`);
   *          acceptable to launch with, but photography is preferred.
   * final — photography.
   */
  status: "placeholder" | "render" | "final";
  /** Shot brief for the photographer. */
  brief: string;
}

const ph = (name: string, width: number, height: number, alt: string, brief: string): ImageAsset => ({
  src: `/images/placeholders/${name}.jpg`,
  width,
  height,
  alt,
  status: "placeholder",
  brief,
});

const rd = (name: string, width: number, height: number, alt: string, brief: string): ImageAsset => ({
  src: `/images/renders/${name}.jpg`,
  width,
  height,
  alt,
  status: "render",
  brief,
});

export const HERO_RENDER = rd("hero-closed", 2400, 1350, "A tall walnut pivot door in a dark entrance, with lattice-patterned sunlight falling across it.", "Hero photograph: installed pivot or carved entrance at golden hour.");
export const HERO_RENDER_PORTRAIT = rd("hero-closed-portrait", 1080, 1700, "A tall walnut pivot door in a dark entrance, with lattice-patterned sunlight.", "Portrait crop of the hero photograph for phones.");
export const HERO_OPEN_RENDER = rd("hero-open", 2400, 1350, "The pivot door swung open, warm light spilling across the floor.", "Photograph of the entrance door open at dusk with interior light.");

export const PRODUCT_RENDERS: Record<StyleId, ImageAsset> = Object.fromEntries(
  (["flush", "shaker", "panel4", "grooved", "glass", "louvre", "main", "pivot", "barn"] as StyleId[]).map((id) => [
    id,
    rd(`product-${id}`, 1200, 1500, `${getStyle(id).name} door in its standard specification, rendered in a plaster wall.`, "Product photograph in the default specification, three-quarter view, soft studio light."),
  ]),
) as Record<StyleId, ImageAsset>;

export const PRODUCT_WIDE_RENDERS: Record<StyleId, ImageAsset> = Object.fromEntries(
  (["flush", "shaker", "panel4", "grooved", "glass", "louvre", "main", "pivot", "barn"] as StyleId[]).map((id) => [
    id,
    rd(`product-wide-${id}`, 1920, 1200, `${getStyle(id).name} door in its standard specification, rendered in a plaster wall.`, "Landscape product photograph, installed, three-quarter view."),
  ]),
) as Record<StyleId, ImageAsset>;

export const MACRO_RENDERS = {
  hardware: rd("macro-hardware", 1600, 1200, "Close-up of an antique brass lever and mortise lock on walnut veneer.", "Macro photograph of a lever on a finished door."),
  panel: rd("macro-panel", 1600, 1200, "Close-up of a raised panel's bevelled edge in teak veneer.", "Macro photograph of a raised panel edge."),
  grain: rd("macro-grain", 1600, 1200, "Close-up of oak veneer with fine horizontal V-grooves.", "Macro photograph of veneer grain and grooves."),
  louvre: rd("macro-louvre", 1600, 1200, "Close-up of angled louvre slats in sage paint.", "Macro photograph of louvre slats."),
} as const;

export const SAMPLE_ROOMS = [
  { id: "hallway", label: "Plaster hallway", image: ph("sample-room-hallway", 1600, 1200, "A plastered hallway with an empty doorway.", "4:3 sample room with a clear, straight-on doorway.") },
  { id: "entrance", label: "Stone entrance", image: ph("sample-room-entrance", 1600, 1200, "An entrance with stone cladding and an empty doorway.", "4:3 sample entrance with a clear, straight-on doorway.") },
] as const;

export function allAssets(): ImageAsset[] {
  return [
    HERO_RENDER,
    HERO_RENDER_PORTRAIT,
    HERO_OPEN_RENDER,
    ...Object.values(PRODUCT_RENDERS),
    ...Object.values(PRODUCT_WIDE_RENDERS),
    ...Object.values(MACRO_RENDERS),
    ...SAMPLE_ROOMS.map((s) => s.image),
  ];
}
