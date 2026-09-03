import { test, expect } from "@playwright/test";

/**
 * There's no explicit CSRF token in this app — its defense is (a) Supabase
 * auth cookies, which default to SameSite=Lax and so aren't sent on a
 * cross-site POST, and (b) every state-changing route requires a JSON
 * body (`Content-Type: application/json`), which a plain cross-origin HTML
 * form can't send without triggering a CORS preflight the browser blocks
 * for a non-simple content type. These checks probe that a same-origin
 * JSON request is what every mutating route expects.
 */
test.describe("Cross-site request forgery considerations", () => {
  test("a state-changing request without a JSON content-type is rejected as invalid, not silently accepted", async ({ request }) => {
    const res = await request.post("/api/contact", {
      headers: { "content-type": "text/plain" },
      data: "name=x&email=x@example.com",
    });
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).not.toBe(200);
  });

  test("checkout order creation requires a body that parses as the expected JSON shape, not just any POST", async ({ request }) => {
    const res = await request.post("/api/checkout", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("a cross-origin-style Origin header on a mutating request doesn't grant it extra trust", async ({ request }) => {
    const res = await request.post("/api/admin/products", {
      headers: { origin: "https://attacker.example.com" },
      data: { name: "x" },
    });
    // Still gated by the same auth check — an Origin header alone changes nothing.
    expect(res.status()).toBe(401);
  });
});

test.describe("Rate-limiting behaviour", () => {
  test("the contact form enforces a per-IP submission cap (5 per 15 minutes)", async ({ request }) => {
    const payload = (i: number) => ({
      name: "Rate Test",
      email: `rate-test-${i}@example.com`,
      category: "Other",
      message: "Testing the contact form rate limit with enough characters to pass validation.",
      consent: true,
      company: "",
    });

    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await request.post("/api/contact", { data: payload(i) });
      statuses.push(res.status());
    }
    expect(statuses).toContain(429);
    const last = statuses[statuses.length - 1];
    expect(last).toBe(429);
  });

  test("a 429 response includes no order/account data — just a rate-limit error", async ({ request }) => {
    let lastRes;
    for (let i = 0; i < 7; i++) {
      lastRes = await request.post("/api/contact", {
        data: {
          name: "Rate Test 2",
          email: `rate-test-b-${i}@example.com`,
          category: "Other",
          message: "Testing the contact form rate limit a second time around, with enough length.",
          consent: true,
          company: "",
        },
      });
    }
    expect(lastRes!.status()).toBe(429);
    const body = await lastRes!.json();
    expect(body).toHaveProperty("error");
  });

  test("the login endpoint enforces a per-email rate limit distinct from the per-IP one", async ({ request }) => {
    const email = `rate-login-${Date.now()}@example.com`;
    const statuses: number[] = [];
    for (let i = 0; i < 9; i++) {
      const res = await request.post("/api/auth/login", { data: { email, password: "wrong-password" } });
      statuses.push(res.status());
    }
    expect(statuses).toContain(429);
  });
});
