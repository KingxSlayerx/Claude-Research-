import { expect, test, type Page } from "@playwright/test";
import { defaultConfig } from "../../src/domain/config";
import { priceDoor, quoteTotals } from "../../src/domain/pricing";
import { inr } from "../../src/domain/format";
import { expectNoHorizontalOverflow } from "./helpers";

async function addDoor(page: Page, style: string) {
  await page.goto(`/design?style=${style}`);
  await expect(page).toHaveURL(/\/design$/);
  await page.getByRole("button", { name: "Add to quote" }).filter({ visible: true }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "to your quote" })).toBeVisible();
}

async function fillDetails(page: Page) {
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByLabel(/Email/).fill("asha@example.com");
  await page.getByLabel("Site locality").fill("Kokapet");
  await page.getByLabel("Project type").selectOption("Renovation");
  await page.getByLabel("Needed by").selectOption("3+ months");
  await page.getByRole("checkbox", { name: /may call, message or email/ }).check();
}

test.describe("quote journey", () => {
  test("add, edit, duplicate, remove, set quantities and submit @mobile", async ({ page }) => {
    await addDoor(page, "panel4");
    await addDoor(page, "louvre");
    await page.goto("/quote");
    const items = page.getByRole("list", { name: "Doors in your quote" }).getByRole("listitem");
    await expect(items).toHaveCount(2);

    // duplicate + remove with undo
    await page.getByRole("button", { name: /Duplicate Louvred/ }).click();
    await expect(items).toHaveCount(3);
    await page.getByRole("button", { name: /Remove Louvred, item 3/ }).click();
    await expect(items).toHaveCount(2);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(items).toHaveCount(3);
    await page.getByRole("button", { name: /Remove Louvred, item 3/ }).click();
    await expect(items).toHaveCount(2);

    // quantity
    await page.getByRole("button", { name: "Increase quantity of four-panel" }).click();
    await page.getByRole("button", { name: "Increase quantity of four-panel" }).click();

    // edit: change the louvred door to a black finish
    await page.getByRole("link", { name: /Edit Louvred/ }).click();
    await expect(page.getByText("You’re editing a door in your quote.")).toBeVisible();
    await page.getByRole("group", { name: /^Colour/ }).getByText("Black", { exact: true }).click();
    await page.getByRole("button", { name: /Save/ }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/quote$/);
    await expect(items.nth(1)).toContainText("PU paint Black");

    const louvre = { ...defaultConfig("louvre"), color: "pu-black" };
    const totals = quoteTotals([{ ...defaultConfig("panel4"), qty: 3 }, louvre]);
    await expect(page.getByText(inr(totals.total)).first()).toBeVisible();
    await expect(page.getByText(`GST at 18%`)).toBeVisible();

    // validation
    await page.getByRole("button", { name: /Send quote request/ }).click();
    await expect(page.getByText("Enter your name so the showroom knows who to ask for.")).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeFocused();
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByLabel("Mobile number").blur();
    await expect(page.getByText(/10-digit Indian mobile number/)).toBeVisible();

    await fillDetails(page);
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: /Send quote request/ }).click();

    await expect(page.getByRole("heading", { name: "Thank you, Asha." })).toBeVisible();
    const ref = await page.getByText(/^TH-\d{6}-[A-Z0-9]{5}$/).textContent();
    expect(ref).toMatch(/^TH-/);
    await expect(page.getByText(`estimated at ${inr(totals.total)} including GST`)).toBeVisible();

    await page.getByRole("button", { name: "Start a new quote" }).click();
    await expect(page.getByText("Your quote is empty.")).toBeVisible();
    await expect(page.getByText(ref!)).toBeVisible();
  });

  test("a backend failure is reported, nothing is lost, and retry succeeds", async ({ page }) => {
    await addDoor(page, "flush");
    await page.goto("/quote");
    await fillDetails(page);

    await page.route("/api/quotes", (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"boom"}' }));
    await page.getByRole("button", { name: /Send quote request/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Your request was not sent." })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Thank you/ })).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Doors in your quote" }).getByRole("listitem")).toHaveCount(1);

    await page.route("/api/quotes", (route) => route.abort("failed"));
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "couldn't reach the showroom" })).toBeVisible();

    await page.unroute("/api/quotes");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { name: "Thank you, Asha." })).toBeVisible();
    await expect(page.getByText(`estimated at ${inr(Math.round(priceDoor(defaultConfig("flush")).unit * 1.18))}`)).toBeVisible();
  });
});
