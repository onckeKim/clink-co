import { Suspense } from "react";
import type { Metadata } from "next";
import { getActiveProducts } from "@/data/products";
import { ShopExperience } from "@/components/catalogue/ShopExperience";
import { ShopSkeleton } from "@/components/catalogue/ShopSkeleton";

export const metadata: Metadata = {
  title: "Shop All",
  description:
    "Browse the full Clink & Co range — glassware, barware, tableware, serveware, gift sets and accessories.",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopExperience
        products={getActiveProducts()}
        title="Shop All"
        description="Every piece in the Clink & Co range, from everyday glassware to considered gifting."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      />
    </Suspense>
  );
}
