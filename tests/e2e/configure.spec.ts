import { expect, test } from "@playwright/test";
import { STYLES } from "../../src/domain/catalog";
import { applyChange, defaultConfig } from "../../src/domain/config";
import { priceDoor } from "../../src/domain/pricing";
import { inr } from "../../src/domain/format";
import { expectNoHorizontalOverflow, trackErrors } from "./helpers";

test.describe("configurator", () => {
  test("opens every door style with its starting estimate", async ({ page }) => {
    const errors = trackErrors(page);
    for (const s of STYLES) {
      await page.goto(`/design?style=${s.id}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(s.name);
      await expect(page.getByTestId("unit-price")).toHaveText(inr(priceDoor(defaultConfig(s.id)).unit));
      await expect(page).toHaveURL(/\/design$/);
    }
    expect(errors).toEqual([]);
  });

  test("price updates with finish, dimensions, glass, hardware and fitting", async ({ page }) => {
    await page.goto("/design?style=glass");
    let cfg = defaultConfig("glass");
    const price = page.getByTestId("unit-price");
    const check = async () => expect(price).toHaveText(inr(priceDoor(cfg).unit));

    await page.getByText("PU paint", { exact: true }).click();
    cfg = applyChange(cfg, { key: "finish", value: "pu" });
    await check();
    await page.getByRole("group", { name: /^Colour/ }).getByText("Clay", { exact: true }).click();
    cfg = applyChange(cfg, { key: "color", value: "pu-clay" });
    await check();

    const width = page.getByLabel("Width");
    await width.fill("1010");
    await width.press("Enter");
    cfg = applyChange(cfg, { key: "w", value: 1010 });
    await check();
    await width.fill("4000");
    await width.blur();
    await expect(page.getByText(/Adjusted to 1500 mm/)).toBeVisible();
    cfg = applyChange(cfg, { key: "w", value: 1500 });
    await check();

    await page.getByText("Smoked", { exact: true }).click();
    cfg = applyChange(cfg, { key: "glass", value: "smoked" });
    await check();
    await page.getByText("Smart lock", { exact: true }).click();
    cfg = applyChange(cfg, { key: "lock", value: "smart" });
    await check();
    await page.getByText("Teak frame", { exact: true }).click();
    cfg = applyChange(cfg, { key: "frame", value: "teak" });
    await check();
    await page.getByText("Fitting & installation by our team").click();
    cfg = applyChange(cfg, { key: "install", value: false });
    await check();
  });

  test("advice suggests WPC for bathrooms and applies it", async ({ page }) => {
    await page.goto("/design?style=flush");
    await page.getByRole("group", { name: "Where is this door going?" }).getByText("Bathroom", { exact: true }).click();
    await page.getByRole("button", { name: "Switch to WPC" }).click();
    await expect(page.getByRole("radio", { name: /WPC, waterproof/ })).toBeChecked();
    await expect(page.getByRole("button", { name: "Switch to WPC" })).toHaveCount(0);
  });

  test("options are keyboard operable", async ({ page }) => {
    await page.goto("/design?style=flush");
    const ivory = page.getByRole("radio", { name: "Ivory" });
    await ivory.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "Stone" })).toBeChecked();
  });

  test("mobile shows a persistent price and add bar @mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/design?style=shaker");
    await expect(page.getByTestId("mobile-price")).toHaveText(inr(priceDoor(defaultConfig("shaker")).unit));
    await page.getByRole("button", { name: "Increase quantity" }).last().click();
    await expect(page.getByTestId("mobile-price")).toHaveText(inr(priceDoor(defaultConfig("shaker")).unit * 2));
    await expectNoHorizontalOverflow(page);
  });
});
