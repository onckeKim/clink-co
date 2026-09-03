import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { createMedia, listMedia } from "@/lib/admin/media-store";
import { uploadMediaSchema } from "@/lib/validations/admin-media";

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "media:view")) {
    return NextResponse.json({ error: "You don't have permission to view the media library." }, { status: 403 });
  }

  const url = new URL(request.url);
  const media = listMedia({
    search: url.searchParams.get("search") ?? undefined,
    folder: url.searchParams.get("folder") ?? undefined,
    label: url.searchParams.get("label") ?? undefined,
  });

  return NextResponse.json({ media });
}

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "media:write")) {
    return NextResponse.json({ error: "You don't have permission to upload media." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = uploadMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid upload." }, { status: 400 });
  }

  const asset = createMedia({
    url: parsed.data.dataUrl,
    filename: parsed.data.filename,
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
    altText: parsed.data.altText,
    folder: parsed.data.folder,
    labels: parsed.data.labels,
    uploadedBy: ctx.user.id,
  });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Uploaded media",
    entityType: "media",
    entityId: asset.id,
    entityLabel: asset.filename,
    after: { filename: asset.filename, folder: asset.folder, sizeBytes: asset.sizeBytes },
  });

  return NextResponse.json({ media: asset }, { status: 201 });
}
