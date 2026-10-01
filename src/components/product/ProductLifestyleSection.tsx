"use client";

import type { Product } from "@/types/product";
import { LifestyleSplit } from "@/components/sections/LifestyleSplit";
import { useCatalog } from "@/components/providers/CatalogProvider";

/** Reuses the homepage's editorial LifestyleSplit, falling back to the product's category image/copy when no product-specific lifestyle image is authored. */
export function ProductLifestyleSection({ product }: { product: Product }) {
  const { categories } = useCatalog();
  const category = categories.find((c) => c.slug === product.categorySlug);
  const image = product.lifestyleImage ?? category?.image;
  if (!image) return null;

  return (
    <LifestyleSplit
      eyebrow={category?.name ?? "Lifestyle"}
      title={product.lifestyleCaption ?? product.name}
      description={product.shortDescription}
      cta={{ label: "Shop the collection", href: category ? `/shop/${category.slug}` : "/shop" }}
      image={image}
      imageAlt={product.lifestyleCaption ?? `${product.name} styled in a room setting`}
    />
  );
}
