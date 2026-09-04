import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/supabase/dal";
import { getAdminProductById } from "@/lib/admin/products-store";
import { getCategories } from "@/data/categories";
import { getCuratedCollections } from "@/data/collections";
import { ProductForm } from "@/components/admin/products/ProductForm";

export const metadata: Metadata = { title: "Edit Product", robots: { index: false, follow: false } };

export default async function AdminEditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requirePermission("products:write");
  const { id } = await params;

  const product = await getAdminProductById(id);
  if (!product) notFound();

  const categories = await getCategories();
  const collections = await getCuratedCollections();

  return <ProductForm product={product} categories={categories} collections={collections} />;
}
