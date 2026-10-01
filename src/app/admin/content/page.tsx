import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminContentView } from "@/components/admin/content/AdminContentView";

export const metadata: Metadata = { title: "Content", robots: { index: false, follow: false } };

export default async function AdminContentPage() {
  await requirePermission("content:view");
  return <AdminContentView />;
}
