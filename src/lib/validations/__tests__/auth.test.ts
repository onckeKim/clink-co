import { describe, it, expect } from "vitest";
import { loginSchema, signUpSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "@/lib/validations/auth";

describe("loginSchema (form validation)", () => {
  it("accepts a valid email/password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    password: "Passw0rd",
    confirmPassword: "Passw0rd",
    marketingConsent: false,
    termsAccepted: true,
  };

  it("accepts a fully valid sign-up payload", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password under 8 characters", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "Aa1", confirmPassword: "Aa1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password missing an uppercase letter", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "password1", confirmPassword: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password missing a number", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "Password", confirmPassword: "Password" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: "Different1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("rejects unaccepted terms", () => {
    const result = signUpSchema.safeParse({ ...valid, termsAccepted: false });
    expect(result.success).toBe(false);
  });

  it("rejects a missing first name", () => {
    const result = signUpSchema.safeParse({ ...valid, firstName: "" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching strong passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "Passw0rd", confirmPassword: "Passw0rd" });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "Passw0rd", confirmPassword: "Passw0rx" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("rejects when the new password matches the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Passw0rd",
      newPassword: "Passw0rd",
      confirmNewPassword: "Passw0rd",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a genuinely new, matching password pair", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Passw0rd",
      newPassword: "NewPassw0rd",
      confirmNewPassword: "NewPassw0rd",
    });
    expect(result.success).toBe(true);
  });
});
