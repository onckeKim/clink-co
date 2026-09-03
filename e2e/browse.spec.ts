import { test, expect } from "@playwright/test";

test.describe("Browse products", () => {
  test("homepage loads and links into the shop", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Clink & Co/i);
    await page.getByRole("link", { name: "Shop", exact: true }).first().click();
    await expect(page).toHaveURL(/\/shop/);
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
    const openFilters = page.getByRole("button", { name: /filters/i }).first();
    if (await openFilters.isVisible().catch(() => false)) {
      await openFilters.click();
    }
    const availabilitySection = page.getByRole("button", { name: "Availability" });
    if (await availabilitySection.isVisible().catch(() => false)) {
      await availabilitySection.click();
    }
    await page.getByText("In stock only").click();
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
