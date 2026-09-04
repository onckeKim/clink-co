import { Suspense } from "react";
import type { Metadata } from "next";
import { getActiveProducts } from "@/data/products";
import { ShopExperience } from "@/components/catalogue/ShopExperience";
import { ShopSkeleton } from "@/components/catalogue/ShopSkeleton";

export const metadata: Metadata = {
  title: "Shop All",
  description:
    "Browse the full Clink & Co range — glassware, barware, tableware, serveware, gift sets and accessories.",
  alternates: { canonical: "/shop" },
};

export const revalidate = 3600;

export default async function ShopPage() {
  const products = await getActiveProducts();
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopExperience
        products={products}
        title="Shop All"
        description="Every piece in the Clink & Co range, from everyday glassware to considered gifting."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      />
    </Suspense>
  );
}
