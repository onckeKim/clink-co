import { describe, it, expect } from "vitest";
import { uploadMediaSchema } from "@/lib/validations/admin-media";
import { returnRequestSchema } from "@/lib/validations/auth";

const validUpload = {
  dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD",
  filename: "photo.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 1024,
};

describe("uploadMediaSchema (file upload validation)", () => {
  it("accepts a well-formed image upload", () => {
    expect(uploadMediaSchema.safeParse(validUpload).success).toBe(true);
  });

  it("rejects a disallowed mime type (e.g. an executable disguised with an image extension)", () => {
    const result = uploadMediaSchema.safeParse({
      ...validUpload,
      dataUrl: "data:application/x-msdownload;base64,TVo=",
      mimeType: "application/x-msdownload",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload that isn't a data: URI at all", () => {
    const result = uploadMediaSchema.safeParse({ ...validUpload, dataUrl: "https://evil.example.com/payload.js" });
    expect(result.success).toBe(false);
  });

  it("rejects a mismatched dataUrl/mimeType pair (dataUrl content-type spoofing the declared mimeType)", () => {
    const result = uploadMediaSchema.safeParse({
      ...validUpload,
      dataUrl: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      mimeType: "image/jpeg",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file over the size cap (2MB)", () => {
    const result = uploadMediaSchema.safeParse({ ...validUpload, sizeBytes: 3 * 1024 * 1024 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative or zero size", () => {
    expect(uploadMediaSchema.safeParse({ ...validUpload, sizeBytes: 0 }).success).toBe(false);
    expect(uploadMediaSchema.safeParse({ ...validUpload, sizeBytes: -100 }).success).toBe(false);
  });

  it("rejects an empty filename", () => {
    expect(uploadMediaSchema.safeParse({ ...validUpload, filename: "" }).success).toBe(false);
  });
});

describe("returnRequestSchema evidence image validation (file upload validation)", () => {
  it("accepts a well-formed image data URI", () => {
    const result = returnRequestSchema.safeParse({
      reason: "damaged",
      evidenceImages: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-image data URI (e.g. an HTML payload)", () => {
    const result = returnRequestSchema.safeParse({
      reason: "damaged",
      evidenceImages: ["data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 4 evidence images", () => {
    const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
    const result = returnRequestSchema.safeParse({ reason: "damaged", evidenceImages: Array(5).fill(image) });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized base64 payload beyond the character cap", () => {
    const oversized = "data:image/png;base64," + "A".repeat(3_000_000);
    const result = returnRequestSchema.safeParse({ reason: "damaged", evidenceImages: [oversized] });
    expect(result.success).toBe(false);
  });
});
