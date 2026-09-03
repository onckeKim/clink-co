import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { CategoriesListView } from "@/components/admin/categories/CategoriesListView";

export const metadata: Metadata = { title: "Categories", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage() {
  await requirePermission("categories:view");
  return <CategoriesListView />;
}
