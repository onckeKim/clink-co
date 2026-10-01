import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { listProfiles } from "@/lib/account/profiles-store";

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "team:view")) {
    return NextResponse.json({ error: "You don't have permission to view the admin team." }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().toLowerCase();

  let profiles = await listProfiles();
  if (search) {
    profiles = profiles.filter(
      (p) => (p.email ?? "").toLowerCase().includes(search) || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search),
    );
  }

  return NextResponse.json({ profiles });
}
