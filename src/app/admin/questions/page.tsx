import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminQuestionsListView } from "@/components/admin/qa/AdminQuestionsListView";

export const metadata: Metadata = { title: "Questions", robots: { index: false, follow: false } };

export default async function AdminQuestionsPage() {
  await requirePermission("content:view");
  return <AdminQuestionsListView />;
}
