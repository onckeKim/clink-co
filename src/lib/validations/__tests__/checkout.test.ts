import { describe, it, expect } from "vitest";
import { addressSchema, customerDetailsSchema, checkoutRequestSchema } from "@/lib/validations/checkout";

const validAddress = {
  fullName: "Ada Lovelace",
  line1: "1 Long Street",
  suburb: "City Bowl",
  city: "Cape Town",
  province: "Western Cape",
  postalCode: "8001",
  phone: "0821234567",
};

describe("addressSchema (form validation)", () => {
  it("accepts a fully valid South African address", () => {
    expect(addressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("rejects a postal code that isn't 4 digits", () => {
    expect(addressSchema.safeParse({ ...validAddress, postalCode: "801" }).success).toBe(false);
  });

  it("rejects an invalid province (must be a real SA province)", () => {
    expect(addressSchema.safeParse({ ...validAddress, province: "Nowhere" }).success).toBe(false);
  });

  it("rejects a phone number with letters", () => {
    expect(addressSchema.safeParse({ ...validAddress, phone: "call-me-maybe" }).success).toBe(false);
  });

  it("rejects a phone number that's too short", () => {
    expect(addressSchema.safeParse({ ...validAddress, phone: "12345" }).success).toBe(false);
  });

  it("allows an optional line2", () => {
    expect(addressSchema.safeParse({ ...validAddress, line2: "Unit 4" }).success).toBe(true);
    expect(addressSchema.safeParse(validAddress).success).toBe(true);
  });
});

describe("customerDetailsSchema", () => {
  it("requires a valid email", () => {
    const result = customerDetailsSchema.safeParse({
      email: "not-an-email",
      firstName: "Ada",
      lastName: "Lovelace",
      phone: "0821234567",
    });
    expect(result.success).toBe(false);
  });
});

describe("checkoutRequestSchema (server-side re-validation for POST /api/checkout)", () => {
  const validPayload = {
    idempotencyKey: "abc-123",
    customer: { email: "ada@example.com", firstName: "Ada", lastName: "Lovelace", phone: "0821234567" },
    deliveryAddress: validAddress,
    billingAddress: validAddress,
    billingSameAsDelivery: true,
    deliveryMethodId: "standard",
    paymentMethod: "test",
    lines: [{ slug: "solstice-coupe-glasses", quantity: 1 }],
    marketingConsent: false,
    termsAccepted: true,
  };

  it("accepts a fully valid checkout payload", () => {
    expect(checkoutRequestSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects an empty cart", () => {
    expect(checkoutRequestSchema.safeParse({ ...validPayload, lines: [] }).success).toBe(false);
  });

  it("rejects a quantity over the 99 cap (bulk-abuse guard)", () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      lines: [{ slug: "solstice-coupe-glasses", quantity: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer quantity", () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      lines: [{ slug: "solstice-coupe-glasses", quantity: 1.5 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unaccepted terms flag", () => {
    expect(checkoutRequestSchema.safeParse({ ...validPayload, termsAccepted: false }).success).toBe(false);
  });

  it("rejects an invalid payment method", () => {
    expect(checkoutRequestSchema.safeParse({ ...validPayload, paymentMethod: "bitcoin" }).success).toBe(false);
  });

  it("rejects a missing idempotency key", () => {
    expect(checkoutRequestSchema.safeParse({ ...validPayload, idempotencyKey: "" }).success).toBe(false);
  });

  it("strips a client-supplied price on a line — the schema has no such field, so it can never reach the order total (price manipulation guard)", () => {
    const result = checkoutRequestSchema.safeParse({
      ...validPayload,
      lines: [{ slug: "solstice-coupe-glasses", quantity: 1, price: 1 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lines[0]).not.toHaveProperty("price");
    }
  });
});
