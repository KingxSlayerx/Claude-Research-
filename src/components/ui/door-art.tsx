"use client";

import { useId, useMemo } from "react";
import type { DoorConfig } from "@/domain/config";
import { renderDoorSvg, type DoorRenderMode } from "@/render/door-svg";

/** Renders the door illustration for a configuration. */
export function DoorArt({
  config,
  mode = "scene",
  dims = false,
  className = "",
  decorative = false,
  label,
}: {
  config: DoorConfig;
  mode?: DoorRenderMode;
  dims?: boolean;
  className?: string;
  decorative?: boolean;
  label?: string;
}) {
  const id = useId();
  const svg = useMemo(
    () => renderDoorSvg(config, { mode, dims, idPrefix: "da" + id, decorative, label }).svg,
    [config, mode, dims, id, decorative, label],
  );
  return <div className={`door-art ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}
