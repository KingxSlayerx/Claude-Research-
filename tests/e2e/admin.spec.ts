import { expect, test, type Page } from "@playwright/test";
import { E2E_STAFF } from "../../playwright.config";

async function submitQuote(page: Page, name: string) {
  const res = await page.request.post("/api/quotes", {
    headers: { origin: "http://localhost:3100" },
    data: {
      idempotencyKey: crypto.randomUUID(),
      customer: { name, phone: "9000012345", email: "", locality: "Gachibowli", projectType: "New home", timeline: "1–2 months", siteVisit: true, notes: "Lift available", consent: true },
      items: [{ style: "main", qty: 1 }],
      website: "",
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).receipt.reference as string;
}

async function signIn(page: Page, password = E2E_STAFF.password) {
  await page.getByLabel("Email").fill(E2E_STAFF.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("showroom admin", () => {
  test("is not reachable without signing in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);
    const api = await page.request.get("/api/admin/quotes");
    expect(api.status()).toBe(401);
  });

  test("rejects a wrong password", async ({ page }) => {
    await page.goto("/admin/login");
    await signIn(page, "not the password");
    await expect(page.getByRole("alert").filter({ hasText: "don't match a staff account" })).toBeVisible();
  });

  test("staff can find a request, call the customer, update status and add notes @mobile", async ({ page }) => {
    const name = `Ravi Test ${Date.now() % 100000}`;
    const ref = await submitQuote(page, name);

    await page.goto(`/admin/quotes/${ref}`);
    await expect(page).toHaveURL(/\/admin\/login/);
    await signIn(page);
    await expect(page).toHaveURL(new RegExp(`/admin/quotes/${ref}$`));
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.getByRole("link", { name: /Call \+91 90000 12345/ })).toHaveAttribute("href", "tel:+919000012345");
    await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /wa\.me\/919000012345/);
    await expect(page.getByText("Lift available")).toBeVisible();

    await page.getByRole("radio", { name: "Site visit booked" }).click();
    await expect(page.getByText("Saved: Site visit booked")).toBeVisible();
    await page.getByLabel("Add a note").fill("Visit fixed for Saturday 11am");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Visit fixed for Saturday 11am")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("radio", { name: "Site visit booked" })).toBeChecked();
    await expect(page.getByText("Status: New → Site visit booked")).toBeVisible();

    await page.getByRole("link", { name: "← All requests" }).click();
    await page.getByLabel("Search requests").fill(name);
    await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
    await page.getByRole("radio", { name: /^Won/ }).click();
    await expect(page.getByText("Nothing matches")).toBeVisible();
    await page.getByRole("radio", { name: /^Site visit booked/ }).click();
    await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    expect((await page.request.get("/api/admin/quotes")).status()).toBe(401);
  });
});
