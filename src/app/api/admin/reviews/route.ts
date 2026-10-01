import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { listReviews } from "@/lib/admin/reviews-store";
import { dbErrorResponse } from "@/lib/db/errors";
import type { ModerationStatusEnum } from "@/lib/supabase/types";

const STATUSES: ModerationStatusEnum[] = ["pending", "published", "rejected"];

/** The moderation queue — ?status=pending|published|rejected, or every review when omitted. */
export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:view")) {
    return NextResponse.json({ error: "You don't have permission to view reviews." }, { status: 403 });
  }

  const statusParam = new URL(request.url).searchParams.get("status");
  const status = STATUSES.find((s) => s === statusParam);

  try {
    return NextResponse.json({ reviews: await listReviews(status) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
