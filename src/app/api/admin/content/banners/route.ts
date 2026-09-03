import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { createBanner, listAdminBanners } from "@/lib/admin/content-store";
import { bannerSchema } from "@/lib/validations/admin-content";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:view")) {
    return NextResponse.json({ error: "You don't have permission to view content." }, { status: 403 });
  }
  return NextResponse.json({ banners: listAdminBanners() });
}

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid banner." }, { status: 400 });
  }

  const banner = createBanner(parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Created banner",
    entityType: "content",
    entityId: banner.id,
    entityLabel: banner.message,
    after: banner,
  });

  return NextResponse.json({ banner }, { status: 201 });
}
