/** Shared Playwright harness: bundles the 3D stage and renders configurations to images. */
import { build } from "esbuild";
import path from "node:path";
import { chromium, type Page } from "playwright";

export async function openRenderer(width: number, height: number): Promise<{ page: Page; close: () => Promise<void> }> {
  const out = await build({
    entryPoints: [path.join(__dirname, "entry.ts")],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    tsconfig: path.join(__dirname, "../../tsconfig.json"),
    logLevel: "error",
  });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  page.on("pageerror", (e) => console.error("page error:", e));
  page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
  await page.setContent(`<html><body style="margin:0"><canvas id="c" style="width:${width}px;height:${height}px;display:block"></canvas></body></html>`);
  await page.addScriptTag({ content: out.outputFiles[0].text });
  return { page, close: () => browser.close() };
}
