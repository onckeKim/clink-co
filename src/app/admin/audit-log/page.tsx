import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminAuditLogView } from "@/components/admin/audit-log/AdminAuditLogView";

export const metadata: Metadata = { title: "Audit Log", robots: { index: false, follow: false } };

export default async function AdminAuditLogPage() {
  await requirePermission("audit:view");
  return <AdminAuditLogView />;
}
