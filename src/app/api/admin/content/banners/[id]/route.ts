import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { deleteBanner, getAdminBannerById, updateBanner } from "@/lib/admin/content-store";
import { bannerPatchSchema } from "@/lib/validations/admin-content";

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/content/banners/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminBannerById(id);
  if (!before) return NextResponse.json({ error: "Banner not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = bannerPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid banner." }, { status: 400 });
  }

  const banner = updateBanner(id, parsed.data);
  if (!banner) return NextResponse.json({ error: "Banner not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated banner",
    entityType: "content",
    entityId: banner.id,
    entityLabel: banner.message,
    before,
    after: banner,
  });

  return NextResponse.json({ banner });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/content/banners/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminBannerById(id);
  if (!before) return NextResponse.json({ error: "Banner not found." }, { status: 404 });

  deleteBanner(id);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Deleted banner",
    entityType: "content",
    entityId: before.id,
    entityLabel: before.message,
    before,
  });

  return NextResponse.json({ ok: true });
}
