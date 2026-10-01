import type * as React from "react";
import { requireAdmin } from "@/lib/supabase/dal";
import { getPermissions } from "@/lib/admin/roles";
import { AdminShell } from "@/components/admin/AdminShell";

/**
 * Guards every /admin/** route: requireAdmin() redirects signed-out
 * visitors to /login and signed-in non-admins to /account (see the note in
 * src/proxy.ts on why the role check lives here, not in middleware). Every
 * /api/admin/** route independently re-checks via getAdminContext() —
 * this layout is the UX shortcut, not the security boundary.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAdmin();
  const permissions = getPermissions(profile.role);
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || user.email || "Admin";

  return (
    <AdminShell permissions={permissions} role={profile.role} name={name}>
      {children}
    </AdminShell>
  );
}
