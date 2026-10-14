import { expect, test } from "@playwright/test";
import { deflateSync } from "node:zlib";

/** A small valid PNG (solid colour) generated in memory. */
function png(width: number, height: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0xc8)]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

test.describe("visualiser", () => {
  test("upload a room photo, then move and resize the door @mobile", async ({ page }) => {
    await page.goto("/visualise?style=shaker");
    const door = page.getByRole("application");
    await expect(door).toBeVisible();

    await page.locator("#viz-file").setInputFiles({ name: "room.png", mimeType: "image/png", buffer: png(800, 600) });
    await expect(page.getByAltText("Your photo")).toBeVisible();
    await expect(page.getByText("Choose another photo")).toBeVisible();

    const before = await door.boundingBox();
    await door.focus();
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    const afterKeys = await door.boundingBox();
    expect(afterKeys!.x).toBeGreaterThan(before!.x + 5);

    await page.keyboard.press("+");
    await page.keyboard.press("+");
    expect((await door.boundingBox())!.height).toBeGreaterThan(afterKeys!.height);

    // drag with the pointer
    const box = (await door.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height / 2 + 10, { steps: 5 });
    await page.mouse.up();
    expect((await door.boundingBox())!.x).toBeLessThan(box.x - 20);

    await page.getByRole("button", { name: "Reset position" }).click();
    await page.getByRole("combobox", { name: "Door to place" }).selectOption({ label: "Sliding Barn" });
    await expect(door).toHaveAttribute("aria-label", /Sliding Barn/);
  });

  test("rejects files that are not images, with a clear message", async ({ page }) => {
    await page.goto("/visualise");
    await page.locator("#viz-file").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.getByRole("alert").filter({ hasText: "isn't an image" })).toBeVisible();
    await page.locator("#viz-file").setInputFiles({ name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not really a jpeg") });
    await expect(page.getByRole("alert").filter({ hasText: "couldn't open that photo" })).toBeVisible();
  });

  test("states clearly that photos stay on the device", async ({ page }) => {
    await page.goto("/visualise");
    await expect(page.getByText(/isn.t uploaded or saved anywhere/)).toBeVisible();
    await expect(page.getByText(/isn.t a photographic render/)).toBeVisible();
  });
});
