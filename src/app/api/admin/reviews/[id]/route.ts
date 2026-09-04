import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getAdminReview, moderateReview, removeReview } from "@/lib/admin/reviews-store";
import { dbErrorResponse } from "@/lib/db/errors";

const patchSchema = z.object({ status: z.enum(["published", "rejected"]) });

/** Approves/rejects a pending review, or re-moderates one already decided — guard_review_write() (0006_reviews_and_qa.sql) enforces the same content:write requirement server-side. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/reviews/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to moderate reviews." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  let before;
  try {
    before = await getAdminReview(id);
    if (!before) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    await moderateReview(id, parsed.data.status);
  } catch (err) {
    return dbErrorResponse(err);
  }

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: parsed.data.status === "published" ? "Published review" : "Rejected review",
    entityType: "review",
    entityId: before.id,
    entityLabel: `${before.customerName} — ${before.productName}`,
    before: { status: before.status },
    after: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}

/** Removes a review outright (spam/abuse) — review_images cascade with it. */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/reviews/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to delete reviews." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const before = await getAdminReview(id);
    if (!before) return NextResponse.json({ error: "Review not found." }, { status: 404 });

    await removeReview(id);

    recordAuditLog({
      userId: ctx.user.id,
      userEmail: ctx.user.email ?? "",
      action: "Deleted review",
      entityType: "review",
      entityId: before.id,
      entityLabel: `${before.customerName} — ${before.productName}`,
      before,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
