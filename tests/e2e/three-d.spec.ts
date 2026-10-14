import { expect, test } from "@playwright/test";

test.describe("live 3D @webgl", () => {
  test("configurator renders the door in 3D and opens it @webgl", async ({ page }) => {
    await page.goto("/design?style=pivot");
    await expect(page.locator("[data-webgl]")).toHaveAttribute("data-webgl", "on", { timeout: 120_000 });
    const canvas = page.getByRole("img", { name: /3D preview: Pivot Entrance/ });
    await expect(canvas).toBeVisible();
    await page.getByRole("button", { name: "Open the door" }).click();
    await expect(page.getByRole("button", { name: "Close the door" })).toBeVisible();
    await page.getByRole("button", { name: "Drawing with dimensions" }).click();
    await expect(page.getByRole("img", { name: /^Preview: Pivot Entrance/ })).toBeVisible();
  });

  test("homepage hero mounts the 3D scene @webgl", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("img", { name: /walnut pivot door that opens as you scroll/ })).toBeAttached({ timeout: 120_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/An entrance worth coming home to\./);
  });
});
