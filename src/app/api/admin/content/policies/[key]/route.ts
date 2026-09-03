import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getPolicyPage, updatePolicyPage } from "@/lib/admin/content-store";
import { policyPagePatchSchema } from "@/lib/validations/admin-content";
import type { PolicyPageKey } from "@/types/content";

const VALID_KEYS: PolicyPageKey[] = ["privacy", "terms", "cookie-policy"];

function parseKey(key: string): PolicyPageKey | null {
  return (VALID_KEYS as string[]).includes(key) ? (key as PolicyPageKey) : null;
}

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/content/policies/[key]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:view")) {
    return NextResponse.json({ error: "You don't have permission to view content." }, { status: 403 });
  }

  const { key } = await params;
  const parsedKey = parseKey(key);
  if (!parsedKey) return NextResponse.json({ error: "Unknown policy page." }, { status: 404 });

  return NextResponse.json({ policy: getPolicyPage(parsedKey) });
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/content/policies/[key]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const { key } = await params;
  const parsedKey = parseKey(key);
  if (!parsedKey) return NextResponse.json({ error: "Unknown policy page." }, { status: 404 });

  const before = getPolicyPage(parsedKey);
  const body = await request.json().catch(() => null);
  const parsed = policyPagePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid policy content." }, { status: 400 });
  }

  const policy = updatePolicyPage(parsedKey, parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated policy page",
    entityType: "content",
    entityId: parsedKey,
    entityLabel: policy.title,
    before,
    after: policy,
  });

  return NextResponse.json({ policy });
}
