import { describe, it, expect } from "vitest";
import { contactFormSchema } from "@/lib/validations/contact";
import { newsletterSchema, newsletterSectionSchema } from "@/lib/validations/newsletter";

describe("contactFormSchema (form validation)", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    category: "Order Enquiry" as const,
    message: "I have a question about my recent order, please help.",
    consent: true,
  };

  it("accepts a fully valid enquiry", () => {
    expect(contactFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a message under 10 characters", () => {
    expect(contactFormSchema.safeParse({ ...valid, message: "too short" }).success).toBe(false);
  });

  it("rejects an unaccepted consent checkbox", () => {
    expect(contactFormSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("rejects an invalid enquiry category", () => {
    expect(contactFormSchema.safeParse({ ...valid, category: "Not A Category" }).success).toBe(false);
  });

  it("silently accepts an empty honeypot field (real visitors leave it blank)", () => {
    expect(contactFormSchema.safeParse({ ...valid, company: "" }).success).toBe(true);
  });

  it("rejects any non-empty honeypot value (bot signal)", () => {
    const result = contactFormSchema.safeParse({ ...valid, company: "bot-filled-this" });
    expect(result.success).toBe(false);
  });
});

describe("newsletterSchema", () => {
  it("accepts a valid email", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(newsletterSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("newsletterSectionSchema", () => {
  it("requires consent in addition to a valid email", () => {
    expect(newsletterSectionSchema.safeParse({ email: "a@b.com", consent: true }).success).toBe(true);
    expect(newsletterSectionSchema.safeParse({ email: "a@b.com", consent: false }).success).toBe(false);
  });
});
