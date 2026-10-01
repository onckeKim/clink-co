import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations/contact";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendContactFormAdminNotification } from "@/lib/email";

/**
 * Public contact form submission — no auth required. Spam prevention is
 * two layers, same "cheap, no external dependency" approach as the rest of
 * this app's abuse controls (see src/lib/rate-limit.ts):
 *
 *   1. A honeypot field ("company") real visitors never see (hidden
 *      off-screen in ContactForm.tsx, never focusable) but a bot filling
 *      every input on the page typically will. A non-empty value here
 *      returns the exact same success response as a real submission —
 *      never a different response a bot could learn to route around.
 *   2. A per-IP rate limit, so even a bot that avoids the honeypot can't
 *      submit the form in bulk.
 */
export async function POST(request: Request) {
  const rate = checkRateLimit(`contact:${getClientIp(request)}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many submissions — please try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form and try again." }, { status: 400 });
  }

  // Honeypot tripped — pretend success so a bot gets no signal to adapt to.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  void sendContactFormAdminNotification({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || undefined,
    orderNumber: parsed.data.orderNumber || undefined,
    category: parsed.data.category,
    message: parsed.data.message,
  });

  return NextResponse.json({ ok: true });
}
