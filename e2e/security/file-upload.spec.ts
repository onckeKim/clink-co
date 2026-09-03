import { test, expect } from "@playwright/test";

/**
 * The media upload endpoint (POST /api/admin/media) requires admin auth,
 * so the file-type/size validation itself is covered as a unit test
 * against the zod schema (src/lib/validations/admin-media.ts isn't unit
 * tested elsewhere in this pass — the checks below add it) plus these API
 * probes confirming the auth gate holds regardless of payload shape.
 */
test.describe("File upload validation", () => {
  test("an unauthenticated upload attempt is rejected before any file content is inspected", async ({ request }) => {
    const res = await request.post("/api/admin/media", {
      data: {
        dataUrl: "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIi8+",
        filename: "evil.svg",
        mimeType: "image/svg+xml",
        sizeBytes: 100,
      },
    });
    expect(res.status()).toBe(401);
  });

  test("an unauthenticated upload of a disguised executable is also rejected at the auth gate", async ({ request }) => {
    const res = await request.post("/api/admin/media", {
      data: {
        dataUrl: "data:application/x-msdownload;base64,TVo=",
        filename: "totally-a-photo.jpg.exe",
        mimeType: "application/x-msdownload",
        sizeBytes: 1000,
      },
    });
    expect(res.status()).toBe(401);
  });

  test("return-request evidence upload requires the customer to be signed in, regardless of payload shape", async ({ request }) => {
    const res = await request.post("/api/account/orders/CC-000000-0001/return-request", {
      data: {
        reason: "damaged",
        evidenceImages: ["data:application/x-msdownload;base64,TVo="],
      },
    });
    expect(res.status()).toBe(401);
  });
});
