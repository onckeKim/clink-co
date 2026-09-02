"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import type { Product } from "@/types/product";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/catalogue/Breadcrumbs";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { QuickView } from "@/components/product/QuickView";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useRecentlyViewedStore } from "@/store/recently-viewed-store";
import { siteConfig } from "@/config/site";
import { cn, formatPrice } from "@/lib/utils";

export function ProductDetailView({
  product,
  relatedProducts,
  breadcrumbs,
}: {
  product: Product;
  relatedProducts: Product[];
  breadcrumbs: BreadcrumbItem[];
}) {
  const addItem = useCartStore((state) => state.addItem);
  const wishlisted = useWishlistStore((state) => state.has(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const recordView = useRecentlyViewedStore((state) => state.add);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [selectedVariantId, setSelectedVariantId] = React.useState(product.variants?.[0]?.id);
  const [quickViewProduct, setQuickViewProduct] = React.useState<Product | null>(null);

  React.useEffect(() => {
    recordView(product);
  }, [product, recordView]);

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const displayPrice = product.price + (selectedVariant?.priceDelta ?? 0);
  const discountPercent = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;
  const activeImage = product.images[activeImageIndex] ?? product.images[0];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={breadcrumbs} className="mb-8" />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand/40">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-col gap-1.5">
              {!product.inStock && <Badge variant="light">Out of stock</Badge>}
              {discountPercent !== null && <Badge variant="sale">-{discountPercent}%</Badge>}
              {product.badges?.map((badge) => (
                <Badge key={badge} variant={badge === "Bestseller" ? "dark" : "champagne"}>
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((image, i) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  aria-label={`Show image ${i + 1} of ${product.name}`}
                  aria-pressed={activeImageIndex === i}
                  className={cn(
                    "focus-ring relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-sand/40 transition-colors",
                    activeImageIndex === i ? "border-charcoal" : "border-transparent",
                  )}
                >
                  <Image src={image} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone">
              {product.productType}
            </p>
            <h1 className="font-display mt-2 text-display-lg text-charcoal">{product.name}</h1>
            {product.rating !== undefined && (
              <Rating value={product.rating} count={product.reviewCount} size="sm" className="mt-3" />
            )}
          </div>

          <div className="flex items-baseline gap-3">
            {product.compareAtPrice && (
              <span className="text-base text-stone line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
            <span className="text-2xl font-medium text-charcoal">{formatPrice(displayPrice)}</span>
          </div>

          <p className="text-sm leading-relaxed text-stone">{product.description}</p>

          {product.variants && product.variants.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone">
                Colour{selectedVariant ? `: ${selectedVariant.label}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    aria-label={variant.label}
                    aria-pressed={selectedVariantId === variant.id}
                    className={cn(
                      "focus-ring flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                      selectedVariantId === variant.id ? "border-charcoal" : "border-transparent",
                    )}
                  >
                    <span
                      className="h-7 w-7 rounded-full border border-charcoal/15"
                      style={{ backgroundColor: variant.swatch }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-sand py-5 text-sm sm:grid-cols-3">
            {product.material && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone">Material</dt>
                <dd className="mt-1 text-charcoal">{product.material}</dd>
              </div>
            )}
            {product.capacity && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone">Capacity</dt>
                <dd className="mt-1 text-charcoal">{product.capacity}</dd>
              </div>
            )}
            {product.setSize && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone">Set size</dt>
                <dd className="mt-1 text-charcoal">{product.setSize}</dd>
              </div>
            )}
            {!product.variants?.length && product.colors && product.colors.length > 0 && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone">Colour</dt>
                <dd className="mt-1 text-charcoal">{product.colors.join(", ")}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone">SKU</dt>
              <dd className="mt-1 text-charcoal">{product.sku}</dd>
            </div>
          </dl>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="lg"
              disabled={!product.inStock}
              onClick={() => addItem(product, { variant: selectedVariant })}
              className="flex-1"
            >
              <ShoppingBag className="h-4 w-4" />
              {product.inStock ? "Add to cart" : "Notify me"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => toggleWishlist(product)}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
              className="h-13 w-13"
            >
              <Heart className={cn("h-4 w-4", wishlisted && "fill-charcoal")} />
            </Button>
          </div>

          <div className="flex flex-col gap-2 text-xs text-stone">
            <span className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5" />
              Free delivery on orders over {formatPrice(siteConfig.freeDeliveryThreshold)}
            </span>
            <span className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              {siteConfig.returnWindowDays}-day returns
            </span>
          </div>

          <div className="mt-2 flex flex-col">
            <Disclosure title="Description" defaultOpen>
              <p className="text-sm leading-relaxed text-stone">{product.description}</p>
            </Disclosure>
            <Disclosure title="Care Instructions">
              <ul className="flex flex-col gap-2 text-sm leading-relaxed text-stone">
                {product.careInstructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ul>
            </Disclosure>
            {(product.dimensions || product.weightGrams) && (
              <Disclosure title="Dimensions & Weight">
                <dl className="flex flex-col gap-2 text-sm text-stone">
                  {product.dimensions && (
                    <div className="flex justify-between">
                      <dt>Dimensions</dt>
                      <dd>
                        {product.dimensions.heightCm} × {product.dimensions.widthCm} ×{" "}
                        {product.dimensions.depthCm} cm
                      </dd>
                    </div>
                  )}
                  {product.weightGrams && (
                    <div className="flex justify-between">
                      <dt>Weight</dt>
                      <dd>{product.weightGrams} g</dd>
                    </div>
                  )}
                </dl>
              </Disclosure>
            )}
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            You may also like
          </p>
          <ProductGrid products={relatedProducts} onQuickView={setQuickViewProduct} />
        </div>
      )}

      <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
