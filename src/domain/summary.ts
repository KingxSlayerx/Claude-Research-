import {
  getCore,
  getFinish,
  getFrame,
  getGlass,
  getHandle,
  getHardwareFinish,
  getLock,
  getRoom,
  getStyle,
} from "./catalog";
import { colourOf, type DoorConfig } from "./config";
import { feetInches } from "./format";

/** One-line technical summary (mirrors the original `summary`). */
export function summarize(c: DoorConfig): string {
  const s = getStyle(c.style);
  const parts = [
    s.name,
    `${c.w}×${c.h} mm`,
    `${c.thick} mm`,
    getCore(c.core).label,
    `${getFinish(c.finish).label} ${colourOf(c).label}`,
  ];
  if (s.glass) parts.push(`${getGlass(c.glass).label} glass`);
  parts.push(`${getHandle(c.handle).label} (${getHardwareFinish(c.hw).label})`);
  if (c.lock !== "none") parts.push(getLock(c.lock).label);
  if (!s.noFrame && c.frame !== "none") parts.push(getFrame(c.frame).label);
  if (!s.noFrame && c.arch) parts.push("architrave");
  parts.push(`${c.swing === "R" ? "RH" : "LH"} ${c.open === "in" ? "inward" : "outward"}`);
  return parts.join(" · ");
}

export interface SpecRow {
  label: string;
  value: string;
}

/** Structured specification for display. */
export function specRows(c: DoorConfig): SpecRow[] {
  const s = getStyle(c.style);
  const rows: SpecRow[] = [
    { label: "Style", value: s.name },
    { label: "Room", value: getRoom(c.room).label },
    { label: "Size", value: `${c.w} × ${c.h} mm (${feetInches(c.w)} × ${feetInches(c.h)})` },
    { label: "Thickness", value: `${c.thick} mm` },
    { label: "Core", value: getCore(c.core).label },
    { label: "Finish", value: `${getFinish(c.finish).label}, ${colourOf(c).label}` },
  ];
  if (s.glass) rows.push({ label: "Glass", value: getGlass(c.glass).label });
  rows.push({ label: "Handle", value: `${getHandle(c.handle).label}, ${getHardwareFinish(c.hw).label.toLowerCase()}` });
  rows.push({ label: "Lock", value: getLock(c.lock).label });
  if (s.noFrame) rows.push({ label: "Fitting", value: s.special?.label ?? "No frame" });
  else {
    rows.push({ label: "Frame", value: getFrame(c.frame).label + (c.arch ? " with architrave" : "") });
    rows.push({ label: "Hinges", value: c.hinge === "concealed" ? "Concealed 3D" : "Ball-bearing, visible" });
  }
  rows.push({
    label: "Handing",
    value: `${c.swing === "R" ? "Right hand" : "Left hand"}${c.style === "barn" ? "" : `, opens ${c.open === "in" ? "inward" : "outward"}`}`,
  });
  rows.push({ label: "Installation", value: c.install ? "Included" : "Not included" });
  return rows;
}
