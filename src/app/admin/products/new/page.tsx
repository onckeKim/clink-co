import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { getCategories } from "@/data/categories";
import { getCuratedCollections } from "@/data/collections";
import { ProductForm } from "@/components/admin/products/ProductForm";

export const metadata: Metadata = { title: "New Product", robots: { index: false, follow: false } };

export default async function AdminNewProductPage() {
  await requirePermission("products:write");
  const categories = await getCategories();
  const collections = await getCuratedCollections();

  return <ProductForm categories={categories} collections={collections} />;
}
