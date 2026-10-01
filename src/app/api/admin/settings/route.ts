import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getStoreSettings, updateStoreSettings } from "@/lib/admin/settings-store";
import { storeSettingsPatchSchema } from "@/lib/validations/admin-settings";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "settings:view")) {
    return NextResponse.json({ error: "You don't have permission to view store settings." }, { status: 403 });
  }
  return NextResponse.json({ settings: await getStoreSettings() });
}

export async function PATCH(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "settings:write")) {
    return NextResponse.json({ error: "You don't have permission to edit store settings." }, { status: 403 });
  }

  const before = await getStoreSettings();
  const body = await request.json().catch(() => null);
  const parsed = storeSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings." }, { status: 400 });
  }

  const settings = await updateStoreSettings(parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated store settings",
    entityType: "settings",
    entityId: "store-settings",
    entityLabel: "Store settings",
    before,
    after: settings,
  });

  return NextResponse.json({ settings });
}
