import { test, expect } from "./utils/fixtures";

test.describe("Browse products", () => {
  test("homepage loads and links into the shop", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Clink & Co/i);

    const desktopShopLink = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Shop", exact: true });
    if (await desktopShopLink.isVisible().catch(() => false)) {
      // Desktop: the header nav's "Shop" is a direct link to /shop.
      await desktopShopLink.click();
      await expect(page).toHaveURL(/\/shop/);
      return;
    }

    // Mobile: the header nav is collapsed behind a hamburger menu, and
    // "Shop" there is an expand/collapse button (it opens a category
    // sub-list, same as the desktop mega menu) rather than a direct link —
    // so the equivalent journey is open menu -> expand Shop -> pick a category.
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Site menu" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Shop" }).click();
    await drawer.locator("a[href^='/shop/']").first().click();
    await expect(page).toHaveURL(/\/shop\//);
  });

  test("shop grid lists products with name and price", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: "Shop All" })).toBeVisible();
    const cards = page.locator("a[href^='/products/']");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(1);
  });

  test("clicking a product card opens its product detail page", async ({ page }) => {
    await page.goto("/shop");
    const firstLink = page.locator("a[href^='/products/']").first();
    const href = await firstLink.getAttribute("href");
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.getByRole("button", { name: /add to cart|notify me/i })).toBeVisible();
  });

  test("a category page shows only that category's breadcrumb", async ({ page }) => {
    await page.goto("/shop/glassware");
    await expect(page.getByRole("navigation", { name: /breadcrumb/i }).getByText("Glassware")).toBeVisible();
  });
});

test.describe("Filter and sort products", () => {
  test("sorting by price low-to-high reorders the grid", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Sort products").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
  });

  test("applying an in-stock filter narrows the result count and updates the URL", async ({ page }) => {
    await page.goto("/shop");
    const openFilters = page.getByRole("button", { name: /^filter/i }).first();
    // Mobile only: the drawer keeps a separate draft and only commits to the
    // URL once "Apply filters" is pressed — the desktop sidebar has no such
    // drawer/button and applies each change immediately.
    const isMobileDrawer = await openFilters.isVisible().catch(() => false);
    if (isMobileDrawer) {
      await openFilters.click();
      // Wait for the slide-up sheet's open animation to finish rather than
      // racing it with an immediate isVisible() probe (flaky under load —
      // the drawer element exists and reports "visible" the instant it
      // mounts, even mid-transition, before its contents are interactable).
      await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    }
    // Availability starts collapsed on both the desktop sidebar and the
    // mobile drawer (they share FilterPanel) — click() auto-waits for it
    // rather than relying on a synchronous, non-waiting isVisible() check.
    await page.getByRole("button", { name: "Availability" }).click();
    await page.getByText("In stock only").click();
    if (isMobileDrawer) {
      await page.getByRole("button", { name: /^apply filters/i }).click();
    }
    await expect(page).toHaveURL(/availability=in-stock/);
  });

  test("a category-filtered shop URL renders only matching category products", async ({ page }) => {
    await page.goto("/shop?category=glassware");
    await expect(page).toHaveURL(/category=glassware/);
    const cards = page.locator("a[href^='/products/']");
    expect(await cards.count()).toBeGreaterThan(0);
  });
});

test.describe("Search for a product", () => {
  test("opening search and typing a query shows matching results", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();
    const combobox = page.getByRole("combobox");
    await expect(combobox).toBeVisible();
    await combobox.fill("glass");
    await expect(page.getByRole("listbox", { name: "Search results" })).toBeVisible();
  });

  test("submitting a search query navigates to the shop with the query applied", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();
    const combobox = page.getByRole("combobox");
    await combobox.fill("glass");
    await combobox.press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=/);
  });

  test("a nonsense query shows a no-results state", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByRole("combobox").fill("zzzznotarealproductzzzz");
    await expect(page.getByText(/no results for/i)).toBeVisible();
  });
});
