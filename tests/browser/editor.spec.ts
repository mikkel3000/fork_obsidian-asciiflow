import { test, expect, Page } from "@playwright/test";
async function point(page: Page, row: number, col: number) {
  const canvas = page.locator("canvas"),
    rect = (await canvas.boundingBox())!;
  const width = await canvas.evaluate((c) => {
    const ctx = (c as HTMLCanvasElement).getContext("2d")!;
    ctx.font = "14px monospace";
    return ctx.measureText("M").width;
  });
  return { x: rect.x + (col + 0.5) * width, y: rect.y + (row + 0.5) * 18 };
}
async function drag(page: Page, a: [number, number], b: [number, number]) {
  const start = await point(page, ...a),
    end = await point(page, ...b);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
}
async function snapshot(page: Page) {
  return page.evaluate(() => (window as any).editor.getText() as string);
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
});
test("draw, label, undo, save in place and confirm closing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await drag(page, [2, 2], [7, 20]);
  expect(await snapshot(page)).toContain("┌");
  const p = await point(page, 4, 5);
  await page.mouse.dblclick(p.x, p.y);
  await page.keyboard.type("Hello");
  expect(await snapshot(page)).toContain("Hello");
  await page.keyboard.press("Control+z");
  expect(await snapshot(page)).not.toContain("Hello");
  await page.keyboard.press("Control+Shift+z");
  expect(await snapshot(page)).toContain("Hello");
  await page.keyboard.press("Control+s");
  await expect(page.getByText("Saved to your note.")).toBeVisible();
  expect(await page.evaluate(() => (window as any).closed)).toBeUndefined();
  await page.keyboard.type("!");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click();
  expect(errors).toEqual([]);
});
test("paste floats, commits at pointer, then nudges and duplicates", async ({
  page,
}) => {
  await page.locator("canvas").focus();
  await page.locator("canvas").evaluate((c) => {
    const d = new DataTransfer();
    d.setData("text/plain", "XYZ");
    c.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: d,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  expect(await snapshot(page)).toBe("");
  const p = await point(page, 3, 5);
  await page.mouse.move(p.x, p.y);
  await page.mouse.click(p.x, p.y);
  expect(await snapshot(page)).toBe("\n\n\n     XYZ");
  await page.keyboard.press("ArrowRight");
  expect(await snapshot(page)).toBe("\n\n\n      XYZ");
  await page.keyboard.press("Control+d");
  await page.keyboard.press("Enter");
  expect((await snapshot(page)).match(/XYZ/g)?.length).toBe(2);
});
test("waypoints, zoom, preview and eraser", async ({ page }) => {
  await page.getByRole("button", { name: "Arrow A", exact: true }).click();
  await page.getByLabel("Waypoints").check();
  for (const pair of [
    [2, 2],
    [2, 15],
    [6, 15],
  ] as [number, number][]) {
    const p = await point(page, ...pair);
    await page.mouse.click(p.x, p.y);
  }
  const end = await point(page, 6, 25);
  await page.mouse.move(end.x, end.y);
  await page.keyboard.press("Enter");
  expect(await snapshot(page)).toContain("►");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.getByText("120%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.getByLabel("Plain-text diagram")).toHaveValue(
    await snapshot(page),
  );
  await page.getByRole("button", { name: "Back to drawing" }).click();
  await page.getByRole("button", { name: "Fit", exact: true }).click();
});
test("save failure keeps drawing and draft available", async ({ page }) => {
  await drag(page, [1, 1], [4, 12]);
  await page.evaluate(() => {
    (window as any).failSave = true;
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Simulated save failure");
  expect(await snapshot(page)).toContain("┌");
  await expect
    .poll(() => page.evaluate(() => (window as any).draft))
    .toContain("┌");
});
test("resize box handles and center label", async ({ page }) => {
  await drag(page, [2, 2], [8, 20]);
  const p = await point(page, 4, 4);
  await page.mouse.dblclick(p.x, p.y);
  await page.keyboard.type("Label");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Select V", exact: true }).click();
  await drag(page, [2, 2], [8, 20]);
  await expect(
    page.getByRole("button", { name: "Center label" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Center label" }).click();
  await drag(page, [8, 20], [10, 24]);
  expect((await snapshot(page)).split("\n")[10][24]).toBe("┘");
});
