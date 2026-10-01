import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { answerQuestion, editAnswer, getAdminQuestion, removeAnswer } from "@/lib/admin/qa-store";
import { dbErrorResponse } from "@/lib/db/errors";

const bodySchema = z.object({
  answer: z.string().trim().min(1).max(2000),
  answeredByName: z.string().trim().max(120).optional(),
});

/** Posts staff's first reply to a question — product_answers_write_staff (0006_reviews_and_qa.sql) requires content:write server-side too. product_answers.question_id is unique, so answering an already-answered question fails with a 409 (use PATCH to edit the existing reply instead). */
export async function POST(request: Request, { params }: RouteContext<"/api/admin/questions/[id]/answer">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to answer questions." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter an answer." }, { status: 400 });
  }

  let before;
  try {
    before = await getAdminQuestion(id);
    if (!before) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    await answerQuestion(id, ctx.user.id, parsed.data.answer, parsed.data.answeredByName);
  } catch (err) {
    return dbErrorResponse(err);
  }

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Answered question",
    entityType: "question",
    entityId: before.id,
    entityLabel: `${before.askedBy} — ${before.productName}`,
    after: { answer: parsed.data.answer },
  });

  return NextResponse.json({ ok: true });
}

/** Edits an existing reply's text. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/questions/[id]/answer">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit answers." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.pick({ answer: true }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter an answer." }, { status: 400 });
  }

  let before;
  try {
    before = await getAdminQuestion(id);
    if (!before) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    if (!before.answerId) return NextResponse.json({ error: "This question hasn't been answered yet." }, { status: 409 });
    await editAnswer(before.answerId, parsed.data.answer);
  } catch (err) {
    return dbErrorResponse(err);
  }

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Edited answer",
    entityType: "question",
    entityId: before.id,
    entityLabel: `${before.askedBy} — ${before.productName}`,
    before: { answer: before.answerText },
    after: { answer: parsed.data.answer },
  });

  return NextResponse.json({ ok: true });
}

/** Retracts a reply, returning the question to "awaiting an answer". */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/questions/[id]/answer">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to remove answers." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const before = await getAdminQuestion(id);
    if (!before) return NextResponse.json({ error: "Question not found." }, { status: 404 });
    if (!before.answerId) return NextResponse.json({ error: "This question hasn't been answered yet." }, { status: 409 });

    await removeAnswer(before.answerId);

    recordAuditLog({
      userId: ctx.user.id,
      userEmail: ctx.user.email ?? "",
      action: "Removed answer",
      entityType: "question",
      entityId: before.id,
      entityLabel: `${before.askedBy} — ${before.productName}`,
      before: { answer: before.answerText },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
