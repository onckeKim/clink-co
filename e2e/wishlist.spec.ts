import { test, expect } from "@playwright/test";

test.describe("Add to wishlist", () => {
  test("adding a product from the shop grid marks the heart icon as pressed", async ({ page }) => {
    await page.goto("/shop");
    const firstCard = page.locator("a[href^='/products/']:has(h3)").first();
    await firstCard.hover();
    const wishlistButton = page.getByRole("button", { name: "Add to wishlist" }).first();
    await wishlistButton.click();
    await expect(page.getByRole("button", { name: "Remove from wishlist" }).first()).toBeVisible();
  });

  test("a wishlisted product appears on the wishlist page", async ({ page }) => {
    await page.goto("/shop");
    const firstCard = page.locator("a[href^='/products/']:has(h3)").first();
    const productName = (await firstCard.locator("h3").textContent())?.trim();
    await firstCard.hover();
    await page.getByRole("button", { name: "Add to wishlist" }).first().click();

    await page.goto("/wishlist");
    if (productName) await expect(page.getByText(productName)).toBeVisible();
  });

  test("the header wishlist icon shows an item count badge", async ({ page }) => {
    await page.goto("/shop");
    const firstCard = page.locator("a[href^='/products/']:has(h3)").first();
    await firstCard.hover();
    await page.getByRole("button", { name: "Add to wishlist" }).first().click();
    await expect(page.getByRole("link", { name: /wishlist, 1 item/i })).toBeVisible();
  });
});
