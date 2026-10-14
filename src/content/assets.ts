/**
 * Image manifest. Every image slot on the site is listed here with its
 * status and the brief for the photograph that should replace it.
 * `npm run assets:check` lists the slots still using placeholders.
 */
import type { CollectionId, StyleId } from "@/domain/catalog";

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  status: "placeholder" | "final";
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

export const HERO = ph(
  "hero-entrance",
  2400,
  1500,
  "A tall walnut pivot door set into a warm plaster wall, with patterned sunlight falling across it.",
  "Landscape 3:2, min 3000px wide. A Threshold pivot or carved entrance door installed in a contemporary Hyderabad home. Late-afternoon light, straight-on or slight angle, generous negative space on the left for headline text.",
);

export const CTA_IMAGE = ph(
  "cta-dusk",
  2400,
  1350,
  "A carved teak entrance door at dusk, lit by two brass wall lights.",
  "Landscape 16:9. An installed Threshold entrance door at dusk with warm exterior lighting.",
);

export const COLLECTION_IMAGES: Record<CollectionId, ImageAsset> = {
  entrance: ph("collection-entrance", 1200, 1500, "A carved teak entrance door beside a sandstone wall.", "Portrait 4:5. Installed entrance door, full height visible."),
  panelled: ph("collection-panelled", 1200, 1500, "A four-panel door in teak veneer in a softly lit room.", "Portrait 4:5. Panelled bedroom door in a styled room."),
  contemporary: ph("collection-contemporary", 1200, 1500, "A grooved oak-finish door beside a potted plant.", "Portrait 4:5. Flush or grooved door in a modern interior."),
  "light-air": ph("collection-light-air", 1200, 1500, "An oak door with a slim fluted-glass light.", "Portrait 4:5. Glass-strip or louvred door with daylight."),
  "space-saving": ph("collection-space-saving", 1200, 1500, "An ink-blue sliding barn door on a black wall track.", "Portrait 4:5. Sliding barn door, track visible."),
};

export const DOOR_IMAGES: Record<StyleId, ImageAsset> = Object.fromEntries(
  (
    [
      ["flush", "A flush door in ivory laminate."],
      ["shaker", "A sage-green shaker door with two recessed panels."],
      ["panel4", "A four-panel door in teak veneer with brass lever."],
      ["grooved", "A walnut-grain door with fine horizontal grooves."],
      ["glass", "An oak door with a vertical fluted-glass strip."],
      ["louvre", "A white louvred door in a tiled bathroom."],
      ["main", "A carved teak entrance door with diamond insets."],
      ["pivot", "A tall walnut pivot door with a long black pull."],
      ["barn", "An ink-blue sliding barn door with a Z brace."],
    ] as [StyleId, string][]
  ).map(([id, alt]) => [
    id,
    ph(`door-${id}`, 1200, 1500, alt, "Portrait 4:5. The door in its default specification, installed, full height, styled room."),
  ]),
) as Record<StyleId, ImageAsset>;

export const MATERIAL_IMAGES = {
  wood: ph("material-wood", 1600, 1067, "Planks of teak, walnut, oak and ash side by side.", "Landscape 3:2 macro of real timber and veneer samples."),
  finishes: ph("material-finishes", 1600, 1067, "Fanned finish samples in veneer, laminate and paint.", "Landscape 3:2. Physical finish samples from the showroom."),
  colours: ph("material-colours", 1600, 1067, "Painted sample boards in chalk, sage, clay, ink blue and black.", "Landscape 3:2. PU paint sample boards."),
  hardware: ph("material-hardware", 1600, 1067, "An antique brass lever handle on a walnut door.", "Landscape 3:2 macro of a handle on a finished door."),
} as const;

export const PROCESS_IMAGE = ph(
  "process-measure",
  1600,
  1067,
  "An empty door opening in a plastered wall, ready to be measured.",
  "Landscape 3:2. A Threshold team member measuring an opening on site.",
);

export const SAMPLE_ROOMS = [
  { id: "hallway", label: "Plaster hallway", image: ph("sample-room-hallway", 1600, 1200, "A plastered hallway with an empty doorway.", "4:3 sample room with a clear, straight-on doorway.") },
  { id: "entrance", label: "Stone entrance", image: ph("sample-room-entrance", 1600, 1200, "An entrance with stone cladding and an empty doorway.", "4:3 sample entrance with a clear, straight-on doorway.") },
] as const;

export function allAssets(): ImageAsset[] {
  return [
    HERO,
    CTA_IMAGE,
    PROCESS_IMAGE,
    ...Object.values(COLLECTION_IMAGES),
    ...Object.values(DOOR_IMAGES),
    ...Object.values(MATERIAL_IMAGES),
    ...SAMPLE_ROOMS.map((s) => s.image),
  ];
}
