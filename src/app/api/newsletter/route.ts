import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validations/newsletter";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { subscribeToNewsletter } from "@/lib/newsletter-store";

/** Public newsletter signup — used by both the footer form and the homepage newsletter section. */
export async function POST(request: Request) {
  const rate = checkRateLimit(`newsletter:${getClientIp(request)}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts — please try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 400 },
    );
  }

  subscribeToNewsletter(parsed.data.email, "website");
  return NextResponse.json({ ok: true });
}
