import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { AdminTeamView } from "@/components/admin/team/AdminTeamView";

export const metadata: Metadata = { title: "Team & Roles" };

export default async function AdminTeamPage() {
  const { user, profile } = await requirePermission("team:view");
  return <AdminTeamView currentUserId={user.id} canEdit={hasPermission(profile.role, "team:write")} />;
}
