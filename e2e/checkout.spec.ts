import { test, expect } from "@playwright/test";
import {
  addFirstProductAndGoToCheckout,
  fillCustomerDetails,
  fillDeliveryAddress,
  pickDeliveryMethod,
  continueBilling,
  pickTestPaymentMethod,
  placeOrder,
  runGuestCheckoutToPayment,
} from "./utils/checkout-helpers";

test.describe("Guest checkout", () => {
  test("progresses through every checkout step without needing an account", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    await expect(page.getByRole("heading", { name: "Customer Details" })).toBeVisible();
    await expect(page.getByText(/checking out as a guest/i)).toBeVisible();

    await fillCustomerDetails(page);
    await expect(page.getByRole("heading", { name: "Delivery Address" })).toBeVisible();

    await fillDeliveryAddress(page);
    await expect(page.getByRole("heading", { name: "Delivery Method" })).toBeVisible();

    await pickDeliveryMethod(page);
    await expect(page.getByRole("heading", { name: "Billing Address" })).toBeVisible();

    await continueBilling(page);
    await expect(page.getByRole("heading", { name: "Payment Method" })).toBeVisible();
  });

  test("blocks placing an order until the terms checkbox is accepted", async ({ page }) => {
    await addFirstProductAndGoToCheckout(page);
    await fillCustomerDetails(page);
    await fillDeliveryAddress(page);
    await pickDeliveryMethod(page);
    await continueBilling(page);
    await pickTestPaymentMethod(page);

    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page.getByText(/you must accept the terms/i)).toBeVisible();
  });
});

test.describe("Successful payment", () => {
  test("simulating a successful payment lands on the order confirmation page", async ({ page }) => {
    await runGuestCheckoutToPayment(page);
    await expect(page).toHaveURL(/\/checkout\/pay\//);
    await expect(page.getByText("Test Payment Simulator")).toBeVisible();

    await page.getByRole("button", { name: /simulate successful payment/i }).click();
    await expect(page).toHaveURL(/\/checkout\/confirmation\//);
    await expect(page.getByText(/thank you/i)).toBeVisible();
  });
});

test.describe("Failed payment", () => {
  test("simulating a failed payment shows a failure state on the confirmation page", async ({ page }) => {
    await runGuestCheckoutToPayment(page);
    await page.getByRole("button", { name: /simulate failed payment/i }).click();
    await expect(page).toHaveURL(/\/checkout\/confirmation\/.*payment=failed/);
    await expect(page.getByText(/failed|unsuccessful|couldn't be processed|not been processed/i)).toBeVisible();
  });

  test("a cancelled payment also routes to a non-success confirmation state", async ({ page }) => {
    await runGuestCheckoutToPayment(page);
    await page.getByRole("button", { name: /cancel payment/i }).click();
    await expect(page).toHaveURL(/\/checkout\/confirmation\/.*payment=cancelled/);
  });
});
