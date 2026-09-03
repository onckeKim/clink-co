import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getAdminCollectionById, updateCollection, deleteCollection } from "@/lib/admin/collections-store";
import { adminCollectionPatchSchema } from "@/lib/validations/admin-categories";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/collections/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "collections:view")) {
    return NextResponse.json({ error: "You don't have permission to view collections." }, { status: 403 });
  }

  const { id } = await params;
  const collection = getAdminCollectionById(id);
  if (!collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });

  return NextResponse.json({ collection });
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/collections/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "collections:write")) {
    return NextResponse.json({ error: "You don't have permission to edit collections." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminCollectionById(id);
  if (!before) return NextResponse.json({ error: "Collection not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = adminCollectionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid collection." }, { status: 400 });
  }

  const collection = updateCollection(id, parsed.data);
  if (!collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated collection",
    entityType: "collection",
    entityId: collection.id,
    entityLabel: collection.name,
    before,
    after: collection,
  });

  return NextResponse.json({ collection });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/collections/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "collections:write")) {
    return NextResponse.json({ error: "You don't have permission to delete collections." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminCollectionById(id);
  if (!before) return NextResponse.json({ error: "Collection not found." }, { status: 404 });

  deleteCollection(id);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Deleted collection",
    entityType: "collection",
    entityId: before.id,
    entityLabel: before.name,
    before,
  });

  return NextResponse.json({ ok: true });
}
