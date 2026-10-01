import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { listQuestions } from "@/lib/admin/qa-store";
import { dbErrorResponse } from "@/lib/db/errors";

/** The Q&A queue — ?unanswered=1 for only those still awaiting a reply, or every question when omitted. */
export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:view")) {
    return NextResponse.json({ error: "You don't have permission to view questions." }, { status: 403 });
  }

  const unansweredOnly = new URL(request.url).searchParams.get("unanswered") === "1";

  try {
    return NextResponse.json({ questions: await listQuestions(unansweredOnly) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
