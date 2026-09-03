import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { listAdminCustomers } from "@/lib/admin/customers-store";

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "customers:view")) {
    return NextResponse.json({ error: "You don't have permission to view customers." }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? undefined;

  return NextResponse.json({ customers: listAdminCustomers({ search }) });
}
