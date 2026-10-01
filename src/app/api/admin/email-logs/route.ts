import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { listEmailEvents } from "@/lib/admin/email-log-store";

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "settings:view")) {
    return NextResponse.json({ error: "You don't have permission to view the email log." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const events = listEmailEvents({
    status: status === "sent" || status === "failed" ? status : undefined,
    templateKey: searchParams.get("templateKey") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  return NextResponse.json({ events });
}
