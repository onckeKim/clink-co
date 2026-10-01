"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { buttonVariants } from "@/components/ui/Button";
import { getComplementaryProducts } from "@/lib/catalogue";
import { useCatalog } from "@/components/providers/CatalogProvider";
import type { CartLineInput } from "@/lib/cart-validation";
import { useMounted } from "@/lib/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

// Only mounted once a shopper opens it — deferring keeps its JS out of the
// cart page's initial bundle.
const QuickView = dynamic(() => import("@/components/product/QuickView").then((m) => m.QuickView), { ssr: false });

interface ValidationIssue {
  slug: string;
  message: string;
}

export function CartPageView() {
  const mounted = useMounted();
  const lines = useCartStore((state) => state.lines);
  const [quickViewProduct, setQuickViewProduct] = React.useState<Product | null>(null);
  const [validationIssues, setValidationIssues] = React.useState<ValidationIssue[]>([]);

  const { products } = useCatalog();
  const lineSlugs = React.useMemo(() => lines.map((line) => line.slug), [lines]);
  const complementary = React.useMemo(() => getComplementaryProducts(lineSlugs, products, 4), [lineSlugs, products]);

  // Server round-trip re-checking price/stock — a genuine call, not a
  // decoration. With today's static seed data, client and server agree by
  // construction, but this is exactly the call that starts mattering once
  // product data lives in Supabase and can change between requests.
  React.useEffect(() => {
    // Stale issues from a previous, now-cleared cart are harmless: the JSX
    // below only ever renders `validationIssues` inside the non-empty-cart
    // branch, so there's nothing to reset here.
    if (!mounted || lines.length === 0) return;
    const controller = new AbortController();
    const payload: { lines: CartLineInput[] } = {
      lines: lines.map((line) => ({ slug: line.slug, variantId: line.variant?.id, quantity: line.quantity })),
    };
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { issues?: ValidationIssue[] }) => setValidationIssues(data.issues ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, [mounted, lines]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bag" }]} className="mb-6" />
      <h1 className="font-display mb-8 text-display-lg text-charcoal">Your Bag</h1>

      {!mounted ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]" aria-busy="true" aria-label="Loading your bag">
          <div className="flex flex-col gap-6 border-y border-sand py-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-32 w-28 shrink-0 animate-pulse rounded-xl bg-sand/50" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-sand/50" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-sand/40" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-3xl bg-sand/40" />
        </div>
      ) : lines.length === 0 ? (
        <EmptyCartState />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            {validationIssues.length > 0 && (
              <div className="mb-6 rounded-2xl border border-error/30 bg-error/5 p-4 text-sm text-error">
                <p className="font-medium">Some items in your bag have changed:</p>
                <ul className="mt-1.5 list-disc pl-5">
                  {validationIssues.map((issue) => (
                    <li key={issue.slug}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <ul className="divide-y divide-sand border-y border-sand">
              {lines.map((line) => (
                <CartLineItem key={line.lineId} line={line} />
              ))}
            </ul>

            <Link href="/shop" className={cn(buttonVariants({ variant: "ghost" }), "mt-6")}>
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </Link>
          </div>

          <div className="h-fit rounded-3xl border border-sand p-6 lg:sticky lg:top-28">
            <h2 className="font-display mb-4 text-lg text-charcoal">Order Summary</h2>
            <CartSummary />
            <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}>
              Checkout
            </Link>
          </div>
        </div>
      )}

      {complementary.length > 0 && (
        <div className="mt-20">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            You might also like
          </p>
          <ProductGrid products={complementary} onQuickView={setQuickViewProduct} />
        </div>
      )}

      <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}

function EmptyCartState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-sand py-24 text-center">
      <ShoppingBag className="h-10 w-10 text-stone" strokeWidth={1.5} aria-hidden />
      <div>
        <p className="font-display text-xl text-charcoal">Your bag is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone">
          Browse the shop to find something worth raising a glass to.
        </p>
      </div>
      <Link href="/shop" className={cn(buttonVariants({ size: "lg" }))}>
        Continue shopping
      </Link>
    </div>
  );
}
