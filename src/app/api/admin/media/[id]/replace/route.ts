import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getMediaById, replaceMedia } from "@/lib/admin/media-store";
import { replaceMediaSchema } from "@/lib/validations/admin-media";

export async function POST(request: Request, { params }: RouteContext<"/api/admin/media/[id]/replace">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "media:write")) {
    return NextResponse.json({ error: "You don't have permission to replace media." }, { status: 403 });
  }

  const { id } = await params;
  const before = getMediaById(id);
  if (!before) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = replaceMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid upload." }, { status: 400 });
  }

  const media = replaceMedia(id, {
    url: parsed.data.dataUrl,
    filename: parsed.data.filename,
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
  });
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Replaced media file",
    entityType: "media",
    entityId: media.id,
    entityLabel: media.filename,
    before: { filename: before.filename, sizeBytes: before.sizeBytes },
    after: { filename: media.filename, sizeBytes: media.sizeBytes },
  });

  return NextResponse.json({ media });
}
