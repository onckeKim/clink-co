import { test, expect } from "./utils/fixtures";

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

  test("the wishlist count is reflected in the header", async ({ page }) => {
    await page.goto("/shop");
    const firstCard = page.locator("a[href^='/products/']:has(h3)").first();
    await firstCard.hover();
    await page.getByRole("button", { name: "Add to wishlist" }).first().click();

    const headerIcon = page.getByRole("link", { name: /wishlist, 1 item/i });
    if (await headerIcon.isVisible().catch(() => false)) {
      // Desktop: a dedicated header icon carries the count in its accessible name.
      return;
    }
    // Mobile: that icon is hidden below the header's xl breakpoint — the
    // equivalent surface is the "Wishlist" entry in the slide-out menu,
    // which shows the same count as a visible badge instead.
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Site menu" });
    await expect(drawer.getByRole("link", { name: "Wishlist" })).toContainText("1");
  });
});
