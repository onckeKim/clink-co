import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { createFaq, getFaqs } from "@/lib/admin/content-store";
import { faqSchema } from "@/lib/validations/admin-content";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:view")) {
    return NextResponse.json({ error: "You don't have permission to view content." }, { status: 403 });
  }
  return NextResponse.json({ faqs: getFaqs() });
}

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid FAQ." }, { status: 400 });
  }

  const faq = createFaq(parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Created FAQ",
    entityType: "content",
    entityId: faq.id,
    entityLabel: faq.question,
    after: faq,
  });

  return NextResponse.json({ faq }, { status: 201 });
}
