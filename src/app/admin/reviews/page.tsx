import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminReviewsListView } from "@/components/admin/reviews/AdminReviewsListView";

export const metadata: Metadata = { title: "Reviews", robots: { index: false, follow: false } };

export default async function AdminReviewsPage() {
  await requirePermission("content:view");
  return <AdminReviewsListView />;
}
