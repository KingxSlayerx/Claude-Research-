/** Browser entry for offline renders: exposes window.threshold.render(cfg, opts). */
import { createStage, type StageMode, type ViewOverride } from "../../src/render3d/stage";
import { defaultConfig, type DoorConfig } from "../../src/domain/config";
import type { StyleId } from "../../src/domain/catalog";

declare global {
  interface Window {
    threshold: { render: (cfg: Partial<DoorConfig> & { style: StyleId }, o: { mode: StageMode; open?: number; dolly?: number; view?: ViewOverride }) => string };
  }
}

window.threshold = {
  render(partial, o) {
    const canvas = document.getElementById("c") as HTMLCanvasElement;
    const stage = createStage(canvas, { mode: o.mode, preserveDrawingBuffer: true, pixelRatio: 1 });
    stage.resize();
    stage.setConfig({ ...defaultConfig(partial.style), ...partial });
    if (o.view) stage.setView(o.view);
    stage.setOpen(o.open ?? 0, true);
    stage.setDolly(o.dolly ?? 0);
    stage.render();
    const url = canvas.toDataURL("image/jpeg", 0.9);
    stage.dispose();
    return url;
  },
};
