import "server-only";
import { siteConfig } from "@/config/site";
import { renderEmailHtml, renderEmailText } from "../layout";
import { heading, paragraph, paragraphText, ctaButton, ctaButtonText, calloutBox, calloutBoxText } from "../components";
import type { EmailContent } from "../types";

/**
 * Welcome / email-verification / password-reset.
 *
 * Supabase Auth sends its own built-in emails for verification and
 * password reset today (see supabase.auth.signUp() in
 * src/app/api/auth/signup/route.ts and resetPasswordForEmail() in
 * .../forgot-password/route.ts) — these two templates exist so the
 * branded version is ready either way integration happens:
 *   (a) paste this template's HTML into the Supabase Dashboard's Auth →
 *       Email Templates (the simplest path — Supabase still sends, now
 *       with this branding), or
 *   (b) call supabase.auth.admin.generateLink() server-side to get the
 *       raw action link, then send it through sendTransactionalEmail()
 *       with this template instead of Supabase's built-in emailer.
 * Neither is wired by default; wiring is a deliberate choice about which
 * system owns auth email delivery, not one this task makes for you.
 */

export function welcomeEmailTemplate(data: { firstName: string }): EmailContent {
  const subject = "Welcome to Clink & Co";
  const previewText = `You're in, ${data.firstName} — here's what's next.`;
  const bodyHtml = [
    heading(`Welcome, ${data.firstName}`),
    paragraph("Your account is ready. From here you can track orders, save addresses for faster checkout, and build a wishlist of the pieces you're eyeing."),
    ctaButton("Start Shopping", `${siteConfig.url}/shop`),
    paragraph("If you ever have a question about an order, a product, or anything else, our team is one email away."),
  ].join("");
  const bodyText = [
    `Welcome, ${data.firstName}`,
    paragraphText("Your account is ready. From here you can track orders, save addresses for faster checkout, and build a wishlist of the pieces you're eyeing."),
    ctaButtonText("Start Shopping", `${siteConfig.url}/shop`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function emailVerificationTemplate(data: { firstName: string; verifyUrl: string; expiresInHours: number }): EmailContent {
  const subject = "Confirm your email address";
  const previewText = "One click and you're verified.";
  const bodyHtml = [
    heading(`Confirm your email, ${data.firstName}`),
    paragraph("Please confirm this is your email address to finish setting up your Clink & Co account."),
    ctaButton("Confirm Email Address", data.verifyUrl),
    calloutBox(`This link expires in ${data.expiresInHours} hours. If you didn't create an account with us, you can safely ignore this email.`),
  ].join("");
  const bodyText = [
    `Confirm your email, ${data.firstName}`,
    paragraphText("Please confirm this is your email address to finish setting up your Clink & Co account."),
    ctaButtonText("Confirm Email Address", data.verifyUrl),
    calloutBoxText(`This link expires in ${data.expiresInHours} hours. If you didn't create an account with us, you can safely ignore this email.`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function passwordResetTemplate(data: { firstName: string; resetUrl: string; expiresInMinutes: number }): EmailContent {
  const subject = "Reset your password";
  const previewText = "Here's your password reset link.";
  const bodyHtml = [
    heading(`Reset your password, ${data.firstName}`),
    paragraph("We received a request to reset the password on your Clink & Co account. Click below to choose a new one."),
    ctaButton("Reset Password", data.resetUrl),
    calloutBox(
      `This link expires in ${data.expiresInMinutes} minutes for your security. If you didn't request this, your password hasn't changed — no action is needed, but let us know if it keeps happening.`,
      "warning",
    ),
  ].join("");
  const bodyText = [
    `Reset your password, ${data.firstName}`,
    paragraphText("We received a request to reset the password on your Clink & Co account. Click below to choose a new one."),
    ctaButtonText("Reset Password", data.resetUrl),
    calloutBoxText(`This link expires in ${data.expiresInMinutes} minutes. If you didn't request this, your password hasn't changed — no action needed.`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}
