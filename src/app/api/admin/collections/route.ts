import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { createCollection, listAdminCollections } from "@/lib/admin/collections-store";
import { adminCollectionSchema } from "@/lib/validations/admin-categories";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "collections:view")) {
    return NextResponse.json({ error: "You don't have permission to view collections." }, { status: 403 });
  }

  return NextResponse.json({ collections: listAdminCollections() });
}

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "collections:write")) {
    return NextResponse.json({ error: "You don't have permission to create collections." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid collection." }, { status: 400 });
  }

  const collection = createCollection(parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Created collection",
    entityType: "collection",
    entityId: collection.id,
    entityLabel: collection.name,
    after: collection,
  });

  return NextResponse.json({ collection }, { status: 201 });
}
