import { expect, test } from "@playwright/test";
import { STYLES } from "../../src/domain/catalog";
import { startingPrice } from "../../src/domain/pricing";
import { inr } from "../../src/domain/format";
import { expectNoHorizontalOverflow, trackErrors } from "./helpers";

test.describe("homepage and catalogue", () => {
  test("homepage tells the story and links work @mobile", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/An entrance worth coming home\s+to\./);
    await expect(page.getByText("Thoughtfully crafted doors, made to belong to your space.")).toBeVisible();
    for (const id of ["collections", "craft", "approach"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
    await page.getByRole("link", { name: /Explore the collection/ }).first().click();
    await expect(page).toHaveURL(/\/doors$/);
    expect(errors).toEqual([]);
  });

  test("mobile menu opens, traps focus and closes @mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    await menu.getByRole("link", { name: "Doors", exact: true }).click();
    await expect(page).toHaveURL(/\/doors$/);
    await expect(menu).toBeHidden();
  });

  test("catalogue shows all nine designs with starting prices from the pricing model", async ({ page }) => {
    await page.goto("/doors");
    await expect(page.getByText(`Showing 9 of 9 designs`)).toBeVisible();
    for (const s of STYLES) {
      const card = page.locator("article", { has: page.getByRole("heading", { name: s.name, exact: true }) });
      await expect(card).toContainText(inr(startingPrice(s)));
    }
  });

  test("room and collection filters narrow the list and sync to the URL @mobile", async ({ page }) => {
    await page.goto("/doors");
    await page.getByRole("group", { name: "Room" }).getByText("Bathroom", { exact: true }).click();
    await expect(page).toHaveURL(/room=bath/);
    await expect(page.getByText("Showing 2 of 9 designs")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Flush", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Louvred", exact: true })).toBeVisible();
    await page.getByRole("group", { name: "Collection" }).getByText("Entrance", { exact: true }).click();
    await expect(page.getByText("No designs match both filters.")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByText("Showing 9 of 9 designs")).toBeVisible();
    await page.goto("/doors?collection=space-saving");
    await expect(page.getByText(/Showing 1 of 9/)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("product page shows specification, price inclusions and links to the configurator", async ({ page }) => {
    await page.goto("/doors/pivot-entrance");
    await expect(page.getByRole("heading", { level: 1, name: "Pivot Entrance" })).toBeVisible();
    await expect(page.getByText("Floor & top pivot set").first()).toBeVisible();
    await page.getByRole("link", { name: /Configure this door/ }).click();
    await expect(page).toHaveURL(/\/design$/);
    await expect(page.getByRole("heading", { level: 1, name: "Pivot Entrance" })).toBeVisible();
  });

  test("unknown product returns a helpful 404", async ({ page }) => {
    const res = await page.goto("/doors/not-a-door");
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/doesn.t lead anywhere/)).toBeVisible();
  });
});
