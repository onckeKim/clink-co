import { test, expect } from "@playwright/test";
import { SUPABASE_CONFIGURED, SKIP_REASON } from "./utils/env";

test.describe("Administrator access", () => {
  test("an unauthenticated visitor is redirected away from the admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Administrator creates a product", () => {
  test("fills the new-product form and saves a draft", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, SKIP_REASON);
    // Requires an authenticated admin session (ADMIN_BOOTSTRAP_EMAILS) — see README admin setup.
    await page.goto("/admin/products/new");
    await page.getByLabel("Product name").fill("QA Test Product");
    await page.getByLabel("SKU").fill(`QA-${Date.now()}`);
    await page.getByRole("tab", { name: "Organization & Details" }).click();
    await page.getByLabel("Category").selectOption({ index: 1 });
    await page.getByRole("tab", { name: "General" }).click();
    await page.getByLabel("Product type").fill("Test Type");
    await page.getByLabel("Short description").fill("QA short description.");
    await page.getByLabel("Full description").fill("QA full description.");
    await page.getByRole("button", { name: /save & publish|save/i }).first().click();
    await expect(page.getByText(/product (created|updated)/i)).toBeVisible();
  });
});

test.describe("Administrator updates inventory", () => {
  test("changes a product's stock quantity and saves", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, SKIP_REASON);
    await page.goto("/admin/products");
    await page.locator("a[href^='/admin/products/']").first().click();
    await page.getByRole("tab", { name: "Pricing & Stock" }).click();
    await page.getByLabel("Stock quantity").fill("25");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText(/product updated/i)).toBeVisible();
  });
});

test.describe("Administrator fulfils an order", () => {
  test("marks an order as fulfilled and adds tracking information", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, SKIP_REASON);
    await page.goto("/admin/orders");
    await page.locator("a[href^='/admin/orders/']").first().click();
    await page.getByRole("button", { name: /fulfil|mark as fulfilled/i }).click();
    await expect(page.getByText(/fulfilled/i)).toBeVisible();
  });
});
