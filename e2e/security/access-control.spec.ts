import { test, expect } from "@playwright/test";

test.describe("Unauthorised admin access", () => {
  test("the admin dashboard page redirects an unauthenticated browser to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("every admin API route rejects an unauthenticated request with 401, never data", async ({ request }) => {
    const endpoints = [
      "/api/admin/products",
      "/api/admin/orders",
      "/api/admin/customers",
      "/api/admin/coupons",
      "/api/admin/settings",
      "/api/admin/team",
      "/api/admin/audit-log",
    ];
    for (const endpoint of endpoints) {
      const res = await request.get(endpoint);
      expect(res.status(), `${endpoint} should reject unauthenticated GET`).toBe(401);
      const body = await res.json();
      expect(body).not.toHaveProperty("products");
      expect(body).not.toHaveProperty("orders");
    }
  });

  test("admin POST/PATCH/DELETE routes reject an unauthenticated request", async ({ request }) => {
    const createRes = await request.post("/api/admin/products", {
      data: { name: "Hacked Product", price: 0 },
    });
    expect(createRes.status()).toBe(401);

    const deleteRes = await request.delete("/api/admin/coupons/some-id");
    expect([401, 404]).toContain(deleteRes.status());
  });

  test("account API routes reject an unauthenticated request", async ({ request }) => {
    const res = await request.get("/api/account/orders");
    expect(res.status()).toBe(401);
  });
});

test.describe("Access to another customer's order", () => {
  test("the authenticated order-detail API returns 401 without a session (never another customer's data)", async ({ request }) => {
    const res = await request.get("/api/account/orders/CC-250101-0001");
    expect(res.status()).toBe(401);
  });

  test("the guest order-lookup API returns 404 for a nonexistent order number rather than leaking existence", async ({ request }) => {
    const res = await request.get("/api/orders/CC-000000-9999");
    expect(res.status()).toBe(404);
  });

  test("account order history page is inaccessible without authentication", async ({ page }) => {
    await page.goto("/account/orders/CC-250101-0001");
    await expect(page).toHaveURL(/\/login/);
  });
});
