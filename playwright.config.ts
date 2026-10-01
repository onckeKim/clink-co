import { defineConfig, devices } from "@playwright/test";

/**
 * Browser matrix note: this sandbox only ships the Chromium engine
 * (PLAYWRIGHT_BROWSERS_PATH has no firefox/webkit binaries, and
 * `playwright install` must not be run here). Firefox/Safari/Mobile Safari
 * projects below are defined for CI parity and documentation but are
 * excluded from the default local run via `grep`/`grepInvert`-free project
 * selection — see package.json's `test:e2e` script, which runs only the
 * `chromium`-engine projects. In a CI environment with all engines
 * installed, `npx playwright test` runs the full matrix unmodified.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    // ENABLE_TEST_PAYMENTS keeps the in-app payment simulator ("test"
    // provider — src/lib/payments/providers/test.ts) available even though
    // this is a production build, so the successful/failed-payment E2E
    // flows have a gateway to exercise without real payment credentials.
    command: "npm run build && ENABLE_TEST_PAYMENTS=true npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ENABLE_TEST_PAYMENTS: "true" },
  },
  projects: [
    // --- Chromium-engine projects (executable in this sandbox: only the
    // bundled `chromium` binary is installed, no `msedge`/`chrome` channel) ---
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // "edge" runs on the same bundled Chromium binary (no `msedge` channel
    // is installed in this sandbox) with an Edge-flavoured UA/viewport —
    // real Edge-channel verification is listed under manual testing in the QA report.
    { name: "edge", use: { ...devices["Desktop Edge"] } },
    { name: "chrome-android", use: { ...devices["Pixel 7"] } },

    // --- Non-Chromium engines: config'd for CI, NOT run in this sandbox
    // (no firefox/webkit binaries installed, and `playwright install` is
    // disallowed here — see README/QA report for manual verification) ---
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },

    // --- Responsive viewport sweep (Chromium engine, fixed widths) ---
    { name: "viewport-320", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 720 } } },
    { name: "viewport-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } } },
    { name: "viewport-430", use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 932 } } },
    { name: "viewport-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "viewport-1024", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } } },
    { name: "viewport-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "viewport-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
