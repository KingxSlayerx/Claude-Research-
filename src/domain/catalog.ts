/**
 * Threshold catalogue and rate card.
 *
 * Every number in this file is carried over unchanged from the original
 * `Threshold Door Studio.html` (see legacy/). Do not edit rates, multipliers
 * or fixed prices without business approval — see docs/PRICING-REVIEW.md.
 * `tests/unit/pricing-parity.test.ts` fails if behaviour drifts from the
 * original implementation.
 */

export const PRICING_VERSION = "2024-legacy-1";

export type RoomId = "main" | "bedroom" | "bath" | "utility" | "balcony";
export type StyleId =
  | "flush"
  | "shaker"
  | "panel4"
  | "grooved"
  | "glass"
  | "louvre"
  | "main"
  | "pivot"
  | "barn";
export type CoreId = "hardwood" | "engineered" | "wpc" | "sal" | "teak";
export type Thickness = 32 | 35 | 40 | 45;
export type FinishId = "laminate" | "veneer" | "pu" | "membrane";
export type GlassId = "frosted" | "clear" | "fluted" | "smoked";
export type HandleId = "lever" | "knob" | "pull" | "flush";
export type HardwareFinishId = "steel" | "black" | "brass" | "rose";
export type LockId = "none" | "privacy" | "tubular" | "mortise" | "smart";
export type FrameId = "none" | "wpc" | "sal" | "teak";
export type HingeId = "standard" | "concealed";
export type CollectionId = "entrance" | "panelled" | "contemporary" | "light-air" | "space-saving";

export interface Room {
  id: RoomId;
  label: string;
}

export interface DoorStyleDefaults {
  w?: number;
  h?: number;
  thick?: Thickness;
  core?: CoreId;
  finish?: FinishId;
  color?: string;
  glass?: GlassId;
  handle?: HandleId;
  hw?: HardwareFinishId;
  lock?: LockId;
  frame?: FrameId;
  arch?: boolean;
  room?: RoomId;
}

export interface DoorStyle {
  id: StyleId;
  /** URL slug for the product page. */
  slug: string;
  name: string;
  /** Original one-line description. */
  blurb: string;
  /** Longer editorial description for product pages. */
  story: string;
  /** ₹ per sq ft of shutter at base core / finish / thickness. */
  rate: number;
  rooms: RoomId[];
  collections: CollectionId[];
  /** Has a glass panel (adds glass selection and price). */
  glass?: boolean;
  /** Does not use a conventional frame (frame, architrave and hinge options hidden). */
  noFrame?: boolean;
  /** Mandatory special hardware kit replacing hinges. */
  special?: { label: string; price: number };
  /** Installation charge override (₹ per door). */
  install?: number;
  def: DoorStyleDefaults;
}

export interface Core {
  id: CoreId;
  label: string;
  mult: number;
  note: string;
}
export interface ThicknessOption {
  id: Thickness;
  label: string;
  mult: number;
}
export interface Colour {
  id: string;
  label: string;
  hex: string;
  grain?: boolean;
}
export interface Finish {
  id: FinishId;
  label: string;
  mult: number;
  note: string;
  colors: Colour[];
}
export interface GlassOption {
  id: GlassId;
  label: string;
  price: number;
  fill: string;
}
export interface HandleOption {
  id: HandleId;
  label: string;
  price: number;
}
export interface HardwareFinish {
  id: HardwareFinishId;
  label: string;
  price: number;
  hex: string;
}
export interface LockOption {
  id: LockId;
  label: string;
  price: number;
}
export interface FrameOption {
  id: FrameId;
  label: string;
  price: number;
}
export interface SizePreset {
  w: number;
  h: number;
  label: string;
}

export const BUSINESS_RULES = {
  /** GST applied to the whole estimate (product, hardware and installation). Flagged for review. */
  gstRate: 0.18,
  /** Default fitting & installation charge per door. */
  install: 1800,
  /** Architrave moulding on both faces. */
  architrave: 2600,
  /** Concealed 3D hinge upgrade. */
  concealedHinges: 3400,
  /** Pull handle on a Pivot door is a 1400 mm bar priced at 1.9× the standard pull. */
  pivotPullMultiplier: 1.9,
  width: { min: 600, max: 1500, step: 10 },
  height: { min: 1800, max: 3000, step: 10 },
  qty: { min: 1, max: 99 },
  referencePrefix: "TH",
} as const;

export const ROOMS: Room[] = [
  { id: "main", label: "Main entrance" },
  { id: "bedroom", label: "Bedroom" },
  { id: "bath", label: "Bathroom" },
  { id: "utility", label: "Kitchen & utility" },
  { id: "balcony", label: "Balcony & patio" },
];

/**
 * Collections are a presentation grouping of the nine existing styles.
 * They do not add products. Names are a proposal for business approval.
 */
export const COLLECTIONS: { id: CollectionId; label: string; description: string }[] = [
  {
    id: "entrance",
    label: "Entrance",
    description: "Substantial doors for the first threshold of the home.",
  },
  {
    id: "panelled",
    label: "Panelled",
    description: "Raised and recessed panels with a timeless, crafted profile.",
  },
  {
    id: "contemporary",
    label: "Contemporary",
    description: "Flat and grooved shutters with a quiet, modern line.",
  },
  {
    id: "light-air",
    label: "Light & air",
    description: "Glass lights and louvres that let rooms breathe.",
  },
  {
    id: "space-saving",
    label: "Space-saving",
    description: "Sliding doors for rooms without room to swing.",
  },
];

export const STYLES: DoorStyle[] = [
  {
    id: "flush",
    slug: "flush",
    name: "Flush",
    blurb: "Clean, flat shutter. The everyday bedroom and utility door.",
    story:
      "A single flat plane with nothing to interrupt it. Flush is the quietest door we make — a calm backdrop for bedrooms, bathrooms and utility spaces, and the most economical way to bring a consistent finish through a home.",
    rate: 420,
    rooms: ["bedroom", "utility", "bath"],
    collections: ["contemporary"],
    def: { thick: 32, core: "hardwood", finish: "laminate", color: "lam-ivory", handle: "lever", hw: "steel", lock: "tubular", room: "bedroom" },
  },
  {
    id: "shaker",
    slug: "shaker",
    name: "Shaker",
    blurb: "Two recessed panels with square edges. Calm and timeless.",
    story:
      "Two recessed panels framed by square-edged rails and stiles. Shaker sits comfortably between traditional and modern interiors, and takes painted finishes beautifully.",
    rate: 820,
    rooms: ["bedroom", "utility"],
    collections: ["panelled"],
    def: { thick: 35, core: "engineered", finish: "pu", color: "pu-sage", handle: "lever", hw: "black", lock: "tubular", room: "bedroom" },
  },
  {
    id: "panel4",
    slug: "four-panel",
    name: "Four-Panel",
    blurb: "The classic Indian home door, in solid wood with raised panels.",
    story:
      "Four raised panels in solid wood — the door many of us grew up with, made with care. Its proportions suit bedrooms and traditional entrances alike, and natural veneers bring out the depth of the panel profile.",
    rate: 900,
    rooms: ["bedroom", "main"],
    collections: ["panelled", "entrance"],
    def: { thick: 35, core: "sal", finish: "veneer", color: "ven-teak", handle: "lever", hw: "brass", lock: "mortise", room: "bedroom" },
  },
  {
    id: "grooved",
    slug: "grooved",
    name: "Grooved",
    blurb: "Horizontal V-grooves on a flat shutter. Modern, low-cost upgrade.",
    story:
      "Fine horizontal V-grooves cut across a flat shutter catch the light through the day. A modern detail that lifts an everyday door without the cost of panelling.",
    rate: 640,
    rooms: ["bedroom", "utility"],
    collections: ["contemporary"],
    def: { thick: 32, core: "engineered", finish: "laminate", color: "lam-walnut", handle: "lever", hw: "black", lock: "tubular", room: "bedroom" },
  },
  {
    id: "glass",
    slug: "glass-strip",
    name: "Glass Strip",
    blurb: "A vertical glass light that brings daylight into passages.",
    story:
      "A slender vertical light set into the shutter draws daylight into passages, kitchens and studies while keeping a sense of enclosure. Choose frosted, clear, fluted or smoked glass.",
    rate: 880,
    rooms: ["utility", "balcony", "bedroom"],
    collections: ["light-air"],
    glass: true,
    def: { thick: 35, core: "engineered", finish: "laminate", color: "lam-oak", glass: "fluted", handle: "lever", hw: "black", lock: "tubular", room: "utility" },
  },
  {
    id: "louvre",
    slug: "louvred",
    name: "Louvred",
    blurb: "Angled slats for airflow. Made for bathrooms and stores.",
    story:
      "Angled slats let air move freely while screening the view — practical for bathrooms, stores and utility rooms in a warm climate. Pair with a waterproof WPC core where moisture is a concern.",
    rate: 760,
    rooms: ["bath", "utility"],
    collections: ["light-air"],
    def: { thick: 32, core: "wpc", finish: "pu", color: "pu-white", handle: "knob", hw: "steel", lock: "privacy", room: "bath" },
  },
  {
    id: "main",
    slug: "carved-main",
    name: "Carved Main",
    blurb: "Solid teak entrance with raised panels and diamond insets.",
    story:
      "A solid teak entrance door with deep raised panels and carved diamond insets, framed in teak with architrave on both faces. Made for homes that greet guests with craft.",
    rate: 1500,
    rooms: ["main"],
    collections: ["entrance", "panelled"],
    def: { w: 1000, h: 2400, thick: 40, core: "teak", finish: "veneer", color: "ven-teak", handle: "pull", hw: "brass", lock: "mortise", frame: "teak", arch: true, room: "main" },
  },
  {
    id: "pivot",
    slug: "pivot-entrance",
    name: "Pivot Entrance",
    blurb: "An oversized door that turns on a pivot. Statement entrances.",
    story:
      "An oversized shutter that turns on concealed floor and top pivots instead of hinges. Tall vertical grooves emphasise its height. A statement entrance, specified with a long pull bar and a smart lock.",
    rate: 2200,
    rooms: ["main"],
    collections: ["entrance", "contemporary"],
    noFrame: true,
    special: { label: "Floor & top pivot set", price: 18000 },
    install: 4500,
    def: { w: 1200, h: 2700, thick: 45, core: "engineered", finish: "veneer", color: "ven-walnut", handle: "pull", hw: "black", lock: "smart", frame: "none", room: "main" },
  },
  {
    id: "barn",
    slug: "sliding-barn",
    name: "Sliding Barn",
    blurb: "Slides along a wall track. Saves swing space in tight rooms.",
    story:
      "A shutter that glides along an exposed wall-mounted track, freeing the floor space a swinging door would need. Ideal for compact bedrooms, utility areas and balconies.",
    rate: 980,
    rooms: ["bedroom", "utility", "balcony"],
    collections: ["space-saving"],
    noFrame: true,
    special: { label: "Top track & roller kit", price: 8500 },
    def: { thick: 35, core: "engineered", finish: "pu", color: "pu-ink", handle: "flush", hw: "black", lock: "none", frame: "none", room: "utility" },
  },
];

export const CORES: Core[] = [
  { id: "hardwood", label: "Hardwood flush board", mult: 1.0, note: "Dependable everyday core" },
  { id: "engineered", label: "Engineered wood (HDF)", mult: 0.9, note: "Stable, flat and smooth" },
  { id: "wpc", label: "WPC, waterproof", mult: 1.12, note: "Will not swell with moisture" },
  { id: "sal", label: "Solid sal wood", mult: 1.4, note: "Dense Indian hardwood" },
  { id: "teak", label: "Solid Burma teak", mult: 2.0, note: "The heirloom choice" },
];

export const THICKNESSES: ThicknessOption[] = [
  { id: 32, label: "32 mm", mult: 1 },
  { id: 35, label: "35 mm", mult: 1.08 },
  { id: 40, label: "40 mm", mult: 1.2 },
  { id: 45, label: "45 mm", mult: 1.32 },
];

export const FINISHES: Finish[] = [
  {
    id: "laminate",
    label: "Laminate",
    mult: 1.0,
    note: "1 mm HPL, scratch resistant",
    colors: [
      { id: "lam-ivory", label: "Ivory", hex: "#E7E0D0" },
      { id: "lam-grey", label: "Stone", hex: "#9DA09B" },
      { id: "lam-charcoal", label: "Charcoal", hex: "#3A3C3D" },
      { id: "lam-oak", label: "Oak grain", hex: "#B98F5E", grain: true },
      { id: "lam-walnut", label: "Walnut grain", hex: "#6A4934", grain: true },
    ],
  },
  {
    id: "veneer",
    label: "Natural veneer",
    mult: 1.3,
    note: "Real wood, PU lacquered",
    colors: [
      { id: "ven-teak", label: "Teak", hex: "#8A5A2E", grain: true },
      { id: "ven-walnut", label: "Walnut", hex: "#58392A", grain: true },
      { id: "ven-oak", label: "Oak", hex: "#C39B66", grain: true },
      { id: "ven-ash", label: "Ash", hex: "#D3BE98", grain: true },
    ],
  },
  {
    id: "pu",
    label: "PU paint",
    mult: 1.45,
    note: "Smooth satin, any shade",
    colors: [
      { id: "pu-white", label: "Chalk", hex: "#F0EFEA" },
      { id: "pu-sage", label: "Sage", hex: "#A3B19B" },
      { id: "pu-clay", label: "Clay", hex: "#B4735A" },
      { id: "pu-ink", label: "Ink blue", hex: "#28323C" },
      { id: "pu-black", label: "Black", hex: "#1D1D1E" },
    ],
  },
  {
    id: "membrane",
    label: "Membrane",
    mult: 1.15,
    note: "Seamless PVC wrap, wipe-clean",
    colors: [
      { id: "mem-white", label: "White", hex: "#EBEAE5" },
      { id: "mem-cream", label: "Cream", hex: "#E4DAC3" },
      { id: "mem-grey", label: "Grey", hex: "#8D9295" },
    ],
  },
];

export const GLASSES: GlassOption[] = [
  { id: "frosted", label: "Frosted", price: 2800, fill: "#DCE6E8" },
  { id: "clear", label: "Clear", price: 2200, fill: "#B7CFD6" },
  { id: "fluted", label: "Fluted", price: 3600, fill: "#CFDDE0" },
  { id: "smoked", label: "Smoked", price: 3200, fill: "#4B5154" },
];

export const HANDLES: HandleOption[] = [
  { id: "lever", label: "Lever on rose", price: 1400 },
  { id: "knob", label: "Round knob", price: 750 },
  { id: "pull", label: "Pull bar", price: 3600 },
  { id: "flush", label: "Recessed pull", price: 950 },
];

export const HARDWARE_FINISHES: HardwareFinish[] = [
  { id: "steel", label: "Satin steel", price: 0, hex: "#B9BFC2" },
  { id: "black", label: "Matte black", price: 350, hex: "#1F2021" },
  { id: "brass", label: "Antique brass", price: 700, hex: "#B08A4F" },
  { id: "rose", label: "Rose gold", price: 600, hex: "#C3907C" },
];

export const LOCKS: LockOption[] = [
  { id: "none", label: "No lock", price: 0 },
  { id: "privacy", label: "Privacy latch", price: 650 },
  { id: "tubular", label: "Key lock", price: 950 },
  { id: "mortise", label: "Mortise lock", price: 2400 },
  { id: "smart", label: "Smart lock", price: 16500 },
];

export const FRAMES: FrameOption[] = [
  { id: "none", label: "Shutter only", price: 0 },
  { id: "wpc", label: "WPC frame", price: 3800 },
  { id: "sal", label: "Sal wood frame", price: 4600 },
  { id: "teak", label: "Teak frame", price: 10500 },
];

export const HINGES: { id: HingeId; label: string }[] = [
  { id: "standard", label: "Ball-bearing, visible" },
  { id: "concealed", label: "Concealed 3D" },
];

export const SIZE_PRESETS: SizePreset[] = [
  { w: 750, h: 2100, label: "Bathroom" },
  { w: 800, h: 2100, label: "Utility" },
  { w: 900, h: 2100, label: "Standard" },
  { w: 1000, h: 2100, label: "Wide" },
  { w: 1000, h: 2400, label: "Tall entrance" },
  { w: 1200, h: 2700, label: "Grand" },
];

export const QUOTE_STATUSES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "visit", label: "Site visit booked" },
  { id: "quoted", label: "Quote sent" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]["id"];

export const PROJECT_TYPES = ["New home", "Renovation", "Office / commercial", "Builder project"] as const;
export const TIMELINES = ["Within 2 weeks", "1–2 months", "3+ months", "Just exploring"] as const;

/* ---------- lookups ---------- */

function lookup<T extends { id: string | number }>(list: readonly T[], id: string | number): T | undefined {
  return list.find((x) => x.id === id);
}
function must<T extends { id: string | number }>(list: readonly T[], id: string | number, kind: string): T {
  const v = lookup(list, id);
  if (!v) throw new Error(`Unknown ${kind}: ${String(id)}`);
  return v;
}

export const getStyle = (id: StyleId) => must(STYLES, id, "style");
export const findStyle = (id: string) => lookup(STYLES, id);
export const findStyleBySlug = (slug: string) => STYLES.find((s) => s.slug === slug);
export const getRoom = (id: RoomId) => must(ROOMS, id, "room");
export const getCore = (id: CoreId) => must(CORES, id, "core");
export const getThickness = (id: Thickness) => must(THICKNESSES, id, "thickness");
export const getFinish = (id: FinishId) => must(FINISHES, id, "finish");
export const getGlass = (id: GlassId) => must(GLASSES, id, "glass");
export const getHandle = (id: HandleId) => must(HANDLES, id, "handle");
export const getHardwareFinish = (id: HardwareFinishId) => must(HARDWARE_FINISHES, id, "hardware finish");
export const getLock = (id: LockId) => must(LOCKS, id, "lock");
export const getFrame = (id: FrameId) => must(FRAMES, id, "frame");
export const getStatus = (id: string) => QUOTE_STATUSES.find((s) => s.id === id);
export const getCollection = (id: CollectionId) => must(COLLECTIONS, id, "collection");
