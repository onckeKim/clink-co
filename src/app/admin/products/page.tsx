import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from "@/lib/supabase/dal";
import { getCategories } from "@/data/categories";
import { ProductsListView } from "@/components/admin/products/ProductsListView";

export const metadata: Metadata = { title: "Products", robots: { index: false, follow: false } };

export default async function AdminProductsPage() {
  await requirePermission("products:view");
  const categories = (await getCategories()).map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <Suspense>
      <ProductsListView categories={categories} />
    </Suspense>
  );
}
