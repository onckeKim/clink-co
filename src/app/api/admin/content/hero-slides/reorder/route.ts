import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { reorderHeroSlides } from "@/lib/admin/content-store";
import { reorderHeroSlidesSchema } from "@/lib/validations/admin-content";

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reorderHeroSlidesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid order." }, { status: 400 });
  }

  const heroSlides = reorderHeroSlides(parsed.data.orderedIds);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Reordered hero slides",
    entityType: "content",
    entityId: "hero-slides",
    entityLabel: "Hero slide order",
    after: parsed.data.orderedIds,
  });

  return NextResponse.json({ heroSlides });
}
