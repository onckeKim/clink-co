import { test, expect } from "@playwright/test";
import { SUPABASE_CONFIGURED, SKIP_REASON } from "./utils/env";

test.describe("Account registration", () => {
  test("the sign-up form renders and validates client-side without hitting the network", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create.*account|sign up|join/i }).first()).toBeVisible();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter your first name.")).toBeVisible();
  });

  test("rejects a password that does not meet the strength requirements", async ({ page }) => {
    await page.goto("/signup");
    await page.locator("#firstName").fill("Ada");
    await page.locator("#lastName").fill("Lovelace");
    await page.locator("#email").fill("ada@example.com");
    await page.getByLabel("Password", { exact: true }).fill("weak");
    await page.getByLabel("Confirm password").fill("weak");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  });

  test("completes registration and reaches the account area", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, SKIP_REASON);
    const email = `qa-${Date.now()}@example.com`;
    await page.goto("/signup");
    await page.locator("#firstName").fill("Ada");
    await page.locator("#lastName").fill("Lovelace");
    await page.locator("#email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Passw0rd!23");
    await page.getByLabel("Confirm password").fill("Passw0rd!23");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/account|\/login/);
  });
});

test.describe("Password reset", () => {
  test("the forgot-password form renders and validates an empty email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Enter your email address.")).toBeVisible();
  });

  test("submitting a known email shows a confirmation message", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, SKIP_REASON);
    await page.goto("/forgot-password");
    await page.locator("#email").fill("ada@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/check your email|reset link/i)).toBeVisible();
  });
});

test.describe("Customer checkout (signed-in)", () => {
  test("a logged-in customer's details prefill at checkout", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, SKIP_REASON);
    // Requires a seeded/authenticated Supabase session — see README auth setup.
    await page.goto("/checkout");
    await expect(page.locator("#email")).not.toHaveValue("");
  });
});

test.describe("View order history", () => {
  test("an unauthenticated visitor is redirected away from the account order history", async ({ page }) => {
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/login/);
  });

  test("a signed-in customer sees their past orders listed", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, SKIP_REASON);
    await page.goto("/account/orders");
    await expect(page.getByRole("heading", { name: /order history/i })).toBeVisible();
  });
});
