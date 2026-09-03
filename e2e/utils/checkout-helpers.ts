import type { Page } from "@playwright/test";

/** A postal code inside the metro ranges (Cape Town CBD) so every delivery method (incl. express/pickup) is offered. */
export const TEST_ADDRESS = {
  fullName: "Ada Lovelace",
  line1: "1 Long Street",
  suburb: "City Bowl",
  city: "Cape Town",
  province: "Western Cape",
  postalCode: "8001",
  phone: "0821234567",
};

/**
 * Dismisses the first-visit cookie consent banner if present. On a narrow
 * (mobile) viewport it's a fixed bottom-anchored panel that overlaps the
 * lower part of the page — a real visitor has to deal with it before
 * reaching content underneath it, same as this does, rather than it being
 * a test-only artifact.
 */
export async function dismissCookieBanner(page: Page) {
  const acceptButton = page.getByRole("button", { name: "Accept all" });
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }
}

/** Adds the first shop product to the cart and starts checkout. */
export async function addFirstProductAndGoToCheckout(page: Page) {
  await page.goto("/shop");
  await dismissCookieBanner(page);
  await page.locator("a[href^='/products/']").first().click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/checkout");
}

/** Fills the customer details step and continues.
 * Uses the step's own field ids rather than getByLabel("Email address") —
 * the footer's newsletter signup input shares that exact accessible name
 * on every page, which makes the label query ambiguous. */
export async function fillCustomerDetails(page: Page, email = `qa-${Date.now()}@example.com`) {
  await page.locator("#firstName").fill("Ada");
  await page.locator("#lastName").fill("Lovelace");
  await page.locator("#email").fill(email);
  await page.locator("#phone").fill(TEST_ADDRESS.phone);
  await page.getByRole("button", { name: "Continue to delivery address" }).click();
}

async function fillAddressFields(page: Page, prefix: "delivery" | "billing") {
  await page.locator(`#${prefix}-fullName`).fill(TEST_ADDRESS.fullName);
  await page.locator(`#${prefix}-line1`).fill(TEST_ADDRESS.line1);
  await page.locator(`#${prefix}-suburb`).fill(TEST_ADDRESS.suburb);
  await page.locator(`#${prefix}-city`).fill(TEST_ADDRESS.city);
  await page.locator(`#${prefix}-province`).selectOption(TEST_ADDRESS.province);
  await page.locator(`#${prefix}-postalCode`).fill(TEST_ADDRESS.postalCode);
  await page.locator(`#${prefix}-phone`).fill(TEST_ADDRESS.phone);
}

/** Fills the delivery address step and continues to delivery method. */
export async function fillDeliveryAddress(page: Page) {
  await fillAddressFields(page, "delivery");
  await page.getByRole("button", { name: "Continue to delivery method" }).click();
}

/** Picks the first available delivery method and continues to billing address. */
export async function pickDeliveryMethod(page: Page) {
  await page.locator("button[aria-pressed]").first().click();
  await page.getByRole("button", { name: "Continue to billing address" }).click();
}

/** Billing-same-as-delivery is checked by default — just continue to payment. */
export async function continueBilling(page: Page) {
  await page.getByRole("button", { name: "Continue to payment" }).click();
}

/** Picks the in-app test payment gateway (requires ENABLE_TEST_PAYMENTS=true on the server) and continues to review. */
export async function pickTestPaymentMethod(page: Page) {
  await page.getByRole("button", { name: /Test Payment/i }).click();
  await page.getByRole("button", { name: "Continue to review" }).click();
}

/** Accepts terms and places the order from the review step. */
export async function placeOrder(page: Page) {
  // "Terms of Service" itself is a target=_blank link inside the label —
  // click the checkbox control, not the link text, or this opens a new tab
  // instead of accepting terms.
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Place order" }).click();
}

/** Runs the full guest checkout flow up to (and including) placing the order, landing on the test payment simulator. */
export async function runGuestCheckoutToPayment(page: Page, email?: string) {
  await addFirstProductAndGoToCheckout(page);
  await fillCustomerDetails(page, email);
  await fillDeliveryAddress(page);
  await pickDeliveryMethod(page);
  await continueBilling(page);
  await pickTestPaymentMethod(page);
  await placeOrder(page);
}
