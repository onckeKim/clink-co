import { test, expect } from "@playwright/test";

test.describe("Add a product to the cart", () => {
  test("adding from a product card opens the mini-cart with the item in it", async ({ page }) => {
    await page.goto("/shop");
    // Each product card renders two anchors sharing the same href (an
    // image link and a text link) — only the text one contains the <h3>.
    const namedCard = page.locator("a[href^='/products/']:has(h3)").first();
    const productName = (await namedCard.locator("h3").textContent())?.trim();
    await namedCard.hover();
    const quickAdd = page.getByRole("button", { name: "Quick add" }).first();
    await quickAdd.click();

    const drawer = page.getByRole("dialog", { name: "Shopping bag" });
    await expect(drawer).toBeVisible();
    if (productName) await expect(drawer).toContainText(productName);
  });

  test("adding from the product detail page updates the header cart count", async ({ page }) => {
    await page.goto("/shop");
    await page.locator("a[href^='/products/']").first().click();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("dialog", { name: "Shopping bag" })).toBeVisible();
    await expect(page.getByRole("button", { name: /shopping bag, 1 item/i })).toBeVisible();
  });
});

test.describe("Update cart quantity", () => {
  test("increasing quantity on the cart page updates the line total", async ({ page }) => {
    await page.goto("/shop");
    await page.locator("a[href^='/products/']").first().click();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/cart");

    const increase = page.getByRole("button", { name: "Increase quantity" }).first();
    await increase.click();
    // The quantity display is a sibling <span> between the two stepper buttons.
    const quantityStepper = increase.locator("..");
    await expect(quantityStepper).toContainText("2");
  });

  test("decreasing quantity to zero removes the line from the cart", async ({ page }) => {
    await page.goto("/shop");
    await page.locator("a[href^='/products/']").first().click();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/cart");

    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(page.getByText(/your bag is empty|empty/i)).toBeVisible();
  });
});

test.describe("Apply a coupon", () => {
  test("applying a valid coupon shows the discount in the summary", async ({ page }) => {
    await page.goto("/shop");
    await page.locator("a[href^='/products/']").first().click();
    // Add several units so the cart clears any minimum-spend threshold.
    const qtyPlus = page.getByRole("button", { name: /increase quantity/i });
    if (await qtyPlus.isVisible().catch(() => false)) {
      for (let i = 0; i < 3; i++) await qtyPlus.click().catch(() => {});
    }
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/cart");

    await page.getByLabel("Coupon code").fill("WELCOME10");
    await page.getByRole("button", { name: "Apply" }).click();
    // Rendered with typographic quotes (&ldquo;/&rdquo;), not straight ones.
    await expect(page.getByText(/applied/).filter({ hasText: "WELCOME10" })).toBeVisible();
    await expect(page.getByText(/^-R/)).toBeVisible();
  });

  test("an invalid coupon code shows an error and does not change the total", async ({ page }) => {
    await page.goto("/shop");
    await page.locator("a[href^='/products/']").first().click();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/cart");

    await page.getByLabel("Coupon code").fill("NOTAREALCODE");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/isn't valid/i)).toBeVisible();
  });
});
