import { expect, type Page } from "@playwright/test";

/** Fails if the page scrolls horizontally (layout overflow on small screens). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(1);
}

/** Collects console errors and uncaught exceptions for the test. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

export const rupees = (s: string | null) => Number((s ?? "").replace(/[^\d]/g, ""));
