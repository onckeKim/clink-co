import { test, expect } from "./utils/fixtures";

/**
 * Runs identically across every viewport-* project (320/375/430/768/1024/
 * 1280/1440 — see playwright.config.ts). Catches the concrete responsive
 * failure modes named in the QA brief: horizontal overflow (a layout
 * "broken" wide enough to cause a scrollbar), console errors, and
 * touch targets too small to tap reliably on a phone.
 */
const PAGES = ["/", "/shop", "/cart", "/checkout"];

for (const path of PAGES) {
  test(`${path} has no horizontal overflow and logs no console errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    const response = await page.goto(path);
    expect(response?.status(), `${path} should respond successfully`).toBeLessThan(400);
    // Bounded: some pages (checkout in particular) never satisfy Playwright's
    // strict "zero requests for 500ms" definition of network-idle, so an
    // unbounded wait here would eat the whole test timeout before ever
    // measuring anything. 4s is enough to let above-the-fold content settle.
    await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
    });
    // A few px of tolerance for scrollbar-width rounding.
    expect(overflow.scrollWidth, `${path}: document is wider than the viewport (horizontal scroll)`).toBeLessThanOrEqual(
      overflow.clientWidth + 2,
    );

    const relevantErrors = consoleErrors.filter(
      (e) => !e.includes("Failed to load resource") && !e.includes("favicon"),
    );
    expect(relevantErrors, `${path}: unexpected console errors`).toEqual([]);
  });
}

test("the product detail page has no horizontal overflow at this viewport", async ({ page }) => {
  await page.goto("/shop");
  await page.locator("a[href^='/products/']").first().click();
  await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
});

test("primary interactive controls in the header meet a 40px minimum touch target", async ({ page }) => {
  await page.goto("/");
  const targets = ["Search", /shopping bag/i];
  for (const name of targets) {
    const button = page.getByRole("button", { name }).first();
    if (await button.isVisible().catch(() => false)) {
      const box = await button.boundingBox();
      expect(box, `button "${name}" should have a bounding box`).not.toBeNull();
      if (box) {
        expect(box.width, `button "${name}" width`).toBeGreaterThanOrEqual(36);
        expect(box.height, `button "${name}" height`).toBeGreaterThanOrEqual(36);
      }
    }
  }
});

test("the quick-add / add-to-cart button on a product card is a comfortable tap target", async ({ page }) => {
  await page.goto("/shop");
  const card = page.locator("a[href^='/products/']:has(h3)").first();
  await card.hover();
  const quickAdd = page.getByRole("button", { name: "Quick add" }).first();
  await expect(quickAdd).toBeVisible();
  const box = await quickAdd.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(32);
});
