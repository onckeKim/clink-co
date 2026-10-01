import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getMediaById, updateMedia, deleteMedia } from "@/lib/admin/media-store";
import { updateMediaSchema } from "@/lib/validations/admin-media";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/media/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "media:view")) {
    return NextResponse.json({ error: "You don't have permission to view the media library." }, { status: 403 });
  }

  const { id } = await params;
  const media = getMediaById(id);
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  return NextResponse.json({ media });
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/media/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "media:write")) {
    return NextResponse.json({ error: "You don't have permission to edit media." }, { status: 403 });
  }

  const { id } = await params;
  const before = getMediaById(id);
  if (!before) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update." }, { status: 400 });
  }

  const media = updateMedia(id, parsed.data);
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated media details",
    entityType: "media",
    entityId: media.id,
    entityLabel: media.filename,
    before: { altText: before.altText, folder: before.folder, labels: before.labels },
    after: { altText: media.altText, folder: media.folder, labels: media.labels },
  });

  return NextResponse.json({ media });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/media/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "media:write")) {
    return NextResponse.json({ error: "You don't have permission to delete media." }, { status: 403 });
  }

  const { id } = await params;
  const before = getMediaById(id);
  if (!before) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  const result = await deleteMedia(id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Deleted media",
    entityType: "media",
    entityId: before.id,
    entityLabel: before.filename,
    before: { filename: before.filename, folder: before.folder },
  });

  return NextResponse.json({ ok: true });
}
