import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { deleteHeroSlide, getAdminHeroSlideById, updateHeroSlide } from "@/lib/admin/content-store";
import { heroSlidePatchSchema } from "@/lib/validations/admin-content";

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/content/hero-slides/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminHeroSlideById(id);
  if (!before) return NextResponse.json({ error: "Hero slide not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = heroSlidePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid hero slide." }, { status: 400 });
  }

  const slide = updateHeroSlide(id, parsed.data);
  if (!slide) return NextResponse.json({ error: "Hero slide not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated hero slide",
    entityType: "content",
    entityId: slide.id,
    entityLabel: slide.heading,
    before,
    after: slide,
  });

  return NextResponse.json({ heroSlide: slide });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/content/hero-slides/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminHeroSlideById(id);
  if (!before) return NextResponse.json({ error: "Hero slide not found." }, { status: 404 });

  deleteHeroSlide(id);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Deleted hero slide",
    entityType: "content",
    entityId: before.id,
    entityLabel: before.heading,
    before,
  });

  return NextResponse.json({ ok: true });
}
