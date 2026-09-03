import { test, expect } from "@playwright/test";

/**
 * There is no SQL database in this environment (in-memory TypeScript
 * stores only — see src/lib/admin/*-store.ts), so classic SQL injection
 * isn't directly reachable. The equivalent, meaningful check here is that
 * SQL-metacharacter-laden input is treated as an inert literal string
 * everywhere it's accepted (search, forms) rather than causing an error,
 * a crash, or any unexpected interpretation — the same property a
 * parameterized-query backend would guarantee once one exists.
 */
test.describe("SQL injection protection", () => {
  const sqliPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE products; --",
    "1' UNION SELECT * FROM users--",
    "admin'--",
  ];

  for (const payload of sqliPayloads) {
    test(`search handles the payload ${JSON.stringify(payload)} as literal text, not an error`, async ({ page }) => {
      const response = await page.goto(`/shop?q=${encodeURIComponent(payload)}`);
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("body")).not.toContainText("Internal Server Error");
      // The payload should show up as an inert, literal search query — never interpreted.
      await expect(page.getByText(`No results for "${payload}"`).or(page.locator("a[href^='/products/']").first())).toBeVisible();
    });
  }

  test("the login API treats an SQLi-style email as just an invalid credential, not a bypass", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: "admin'--@example.com", password: "' OR '1'='1" },
    });
    expect(res.status()).not.toBe(200);
  });

  test("the admin product search filter accepts SQLi-style input without error (still gated by auth first)", async ({ request }) => {
    const res = await request.get(`/api/admin/products?search=${encodeURIComponent("'; DROP TABLE products; --")}`);
    // Auth gate fires before the search string is ever used.
    expect(res.status()).toBe(401);
  });
});

test.describe("Cross-site scripting protection", () => {
  const xssPayload = `<script>window.__xss_fired__=true</script>`;

  test("a script-tag payload in the search box is not executed and not reflected as live markup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByRole("combobox").fill(xssPayload);
    const fired = await page.evaluate(() => (window as unknown as { __xss_fired__?: boolean }).__xss_fired__);
    expect(fired).toBeUndefined();
    // The literal text should be visible (React-escaped), not parsed as an element.
    const scriptCount = await page.locator("script").evaluateAll((nodes) =>
      nodes.filter((n) => n.textContent?.includes("__xss_fired__")).length,
    );
    expect(scriptCount).toBe(0);
  });

  test("a script-tag payload in the shop search query param renders as inert text", async ({ page }) => {
    await page.goto(`/shop?q=${encodeURIComponent(xssPayload)}`);
    const fired = await page.evaluate(() => (window as unknown as { __xss_fired__?: boolean }).__xss_fired__);
    expect(fired).toBeUndefined();
  });

  test("submitting the contact form with an XSS payload in the message field is accepted as inert text (rate limit permitting)", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: {
        name: "<img src=x onerror=alert(1)>",
        email: "xss-test@example.com",
        category: "Other",
        message: `Testing XSS handling ${xssPayload} in the message body, which is long enough.`,
        consent: true,
        company: "",
      },
    });
    // Accepted (200) or rate-limited (429) — never a server error from the payload itself.
    expect([200, 429]).toContain(res.status());
  });

  test("the JSON-LD structured data on the homepage cannot be broken out of with a </script> sequence", async ({ page }) => {
    await page.goto("/");
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      expect(content).not.toContain("</script>");
    }
  });
});
