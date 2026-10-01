import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getAdminQuestion, moderateQuestion, removeQuestion } from "@/lib/admin/qa-store";
import { dbErrorResponse } from "@/lib/db/errors";

const patchSchema = z.object({ status: z.enum(["published", "rejected"]) });

/** Hides a question from the public list, or restores a previously-rejected one — product_questions_moderate_staff (0006_reviews_and_qa.sql) enforces the same content:write requirement server-side. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/questions/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to moderate questions." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  let before;
  try {
    before = await getAdminQuestion(id);
    if (!before) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    await moderateQuestion(id, parsed.data.status);
  } catch (err) {
    return dbErrorResponse(err);
  }

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: parsed.data.status === "published" ? "Restored question" : "Rejected question",
    entityType: "question",
    entityId: before.id,
    entityLabel: `${before.askedBy} — ${before.productName}`,
    before: { status: before.status },
    after: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}

/** Removes a question outright (spam/abuse) — its answer, if any, cascades with it. */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/questions/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to delete questions." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const before = await getAdminQuestion(id);
    if (!before) return NextResponse.json({ error: "Question not found." }, { status: 404 });

    await removeQuestion(id);

    recordAuditLog({
      userId: ctx.user.id,
      userEmail: ctx.user.email ?? "",
      action: "Deleted question",
      entityType: "question",
      entityId: before.id,
      entityLabel: `${before.askedBy} — ${before.productName}`,
      before,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
