"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Product } from "@/types/product";
import type { Review } from "@/data/reviews";
import type { QAEntry } from "@/data/qa";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/catalogue/Breadcrumbs";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { ProductGallery } from "@/components/product/ProductGallery";
import { StockStatus } from "@/components/product/StockStatus";
import { ColorSelector, SetSizeSelector } from "@/components/product/VariantSelectors";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { PurchaseActions } from "@/components/product/PurchaseActions";
import { NotifyWhenAvailable } from "@/components/product/NotifyWhenAvailable";
import { DiscontinuedNotice } from "@/components/product/DiscontinuedNotice";
import { DraftNotice } from "@/components/product/DraftNotice";
import { DeliveryEstimator } from "@/components/product/DeliveryEstimator";
import { ProductAccordions } from "@/components/product/ProductAccordions";
import { KeyBenefits } from "@/components/product/KeyBenefits";
import { ProductLifestyleSection } from "@/components/product/ProductLifestyleSection";
import { PairsWellWith } from "@/components/product/PairsWellWith";
import { TrustBadges } from "@/components/product/TrustBadges";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { QandASection } from "@/components/product/QandASection";
import { StickyAddToCart } from "@/components/product/StickyAddToCart";
import { RecentlyViewed } from "@/components/sections/RecentlyViewed";
import { useRecentlyViewedStore } from "@/store/recently-viewed-store";
import { getDiscountPercent } from "@/lib/catalogue";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { formatPrice } from "@/lib/utils";
import { track } from "@/lib/analytics/track";

// Only mounted once a shopper opens it (from "You may also like"/"Pairs
// well with") — deferring keeps its JS out of the PDP's initial bundle.
const QuickView = dynamic(() => import("@/components/product/QuickView").then((m) => m.QuickView), { ssr: false });

export function ProductDetailView({
  product,
  relatedProducts,
  pairedProducts,
  seedReviews,
  qaEntries,
  breadcrumbs,
}: {
  product: Product;
  /** "You may also like" — same category/type, broader net. */
  relatedProducts: Product[];
  /** "Pairs well with" — curated or same-collection cross-sell. */
  pairedProducts: Product[];
  seedReviews: Review[];
  qaEntries: QAEntry[];
  breadcrumbs: BreadcrumbItem[];
}) {
  const recordView = useRecentlyViewedStore((state) => state.add);
  const settings = useStoreSettings();
  const { categories, collections } = useCatalog();

  const [activeVariantId, setActiveVariantId] = React.useState(product.variants?.[0]?.id);
  const [activeSetSizeId, setActiveSetSizeId] = React.useState(product.setSizeOptions?.[0]?.id);
  const [quantity, setQuantity] = React.useState(1);
  const [quickViewProduct, setQuickViewProduct] = React.useState<Product | null>(null);
  const purchaseAnchorRef = React.useRef<HTMLDivElement>(null);

  // Reset all purchase-option state when a different product is shown — App
  // Router can reuse this component instance across a client-side
  // navigation between two /products/[slug] routes. Adjusted during render
  // (not an effect) per React's "resetting state when a prop changes"
  // pattern.
  const [lastProductId, setLastProductId] = React.useState(product.id);
  if (product.id !== lastProductId) {
    setLastProductId(product.id);
    setActiveVariantId(product.variants?.[0]?.id);
    setActiveSetSizeId(product.setSizeOptions?.[0]?.id);
    setQuantity(1);
  }

  React.useEffect(() => {
    recordView(product);
    track({
      name: "product_viewed",
      currency: product.currency,
      items: [{ item_id: product.id, item_name: product.name, price: product.price, item_category: product.categorySlug }],
    });
  }, [product, recordView]);

  const activeVariant = product.variants?.find((v) => v.id === activeVariantId);
  const activeSetSizeOption = product.setSizeOptions?.find((o) => o.id === activeSetSizeId);
  const displayPrice =
    product.price + (activeVariant?.priceDelta ?? 0) + (activeSetSizeOption?.priceDelta ?? 0);
  const discountPercent = product.compareAtPrice ? getDiscountPercent(product) : null;
  const resolvedImages = activeVariant?.images ?? product.images;

  const category = categories.find((c) => c.slug === product.categorySlug);
  const collectionNames = product.collectionSlugs
    .map((slug) => collections.find((c) => c.id === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const isDraft = product.publishStatus === "draft";
  const purchasable = product.inStock && !product.discontinued && !isDraft;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 pb-24 sm:px-8 sm:pb-10">
      <Breadcrumbs items={breadcrumbs} className="mb-6" />

      {isDraft && (
        <div className="mb-8">
          <DraftNotice productName={product.name} />
        </div>
      )}

      {product.discontinued && (
        <div className="mb-8">
          <DiscontinuedNotice productName={product.name} />
        </div>
      )}

      <div className="grid min-w-0 gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative min-w-0">
          <ProductGallery images={resolvedImages} videoUrl={product.videoUrl} productName={product.name} />
          <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-1.5">
            {isDraft && <Badge variant="champagne">Draft</Badge>}
            {product.discontinued && <Badge variant="light">Discontinued</Badge>}
            {!product.discontinued && !product.inStock && <Badge variant="light">Out of stock</Badge>}
            {discountPercent !== null && discountPercent > 0 && <Badge variant="sale">-{discountPercent}%</Badge>}
            {product.badges?.map((badge) => (
              <Badge key={badge} variant={badge === "Bestseller" ? "dark" : "champagne"}>
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone">
              {category && <span>{category.name}</span>}
              {collectionNames.map((collection) => (
                <React.Fragment key={collection.id}>
                  <span aria-hidden>·</span>
                  <Link href={collection.href} className="hover:text-charcoal">
                    {collection.name}
                  </Link>
                </React.Fragment>
              ))}
            </div>
            <h1 className="font-display mt-2 text-display-lg text-charcoal">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {product.rating !== undefined && (
                <a href="#reviews" className="focus-ring rounded">
                  <Rating value={product.rating} count={product.reviewCount} size="sm" />
                </a>
              )}
              <span className="text-stone">SKU: {product.sku}</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-3">
              {product.compareAtPrice && (
                <span className="text-base text-stone line-through">{formatPrice(product.compareAtPrice)}</span>
              )}
              <span className="text-2xl font-medium text-charcoal">{formatPrice(displayPrice)}</span>
            </div>
            <p className="mt-1 text-xs text-stone">
              Inclusive of {settings.taxRatePercent}% VAT. Delivery calculated below.
            </p>
          </div>

          <StockStatus stockQuantity={product.stockQuantity} inStock={product.inStock} />

          <p className="text-sm leading-relaxed text-stone">{product.shortDescription}</p>

          {product.variants && product.variants.length > 0 && (
            <ColorSelector
              variants={product.variants}
              selectedId={activeVariantId}
              onChange={setActiveVariantId}
            />
          )}

          {product.setSizeOptions && product.setSizeOptions.length > 0 && (
            <SetSizeSelector
              options={product.setSizeOptions}
              selectedId={activeSetSizeId}
              onChange={setActiveSetSizeId}
            />
          )}

          {purchasable && (
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={Math.min(product.stockQuantity, 10)}
            />
          )}

          <div ref={purchaseAnchorRef}>
            <PurchaseActions product={product} variant={activeVariant} quantity={quantity} />
          </div>

          {!product.inStock && !product.discontinued && <NotifyWhenAvailable productName={product.name} />}

          {purchasable && <DeliveryEstimator orderValue={displayPrice * quantity} />}

          {product.keyBenefits && product.keyBenefits.length > 0 && (
            <KeyBenefits benefits={product.keyBenefits} />
          )}
        </div>
      </div>

      <div className="mt-16 max-w-3xl">
        <ProductAccordions product={product} />
      </div>

      <div className="mt-10 max-w-3xl">
        <TrustBadges />
      </div>

      <div className="mt-20 -mx-6 sm:-mx-8">
        <ProductLifestyleSection product={product} />
      </div>

      {pairedProducts.length > 0 && (
        <div className="mt-20">
          <PairsWellWith products={pairedProducts} onQuickView={setQuickViewProduct} />
        </div>
      )}

      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            You may also like
          </p>
          <ProductGrid products={relatedProducts} onQuickView={setQuickViewProduct} />
        </div>
      )}

      <div className="mt-20">
        <RecentlyViewed excludeProductId={product.id} />
      </div>

      <div className="mt-20 max-w-3xl border-t border-sand pt-16">
        <ReviewsSection product={product} seedReviews={seedReviews} />
      </div>

      <div className="mt-16 max-w-3xl border-t border-sand pt-16">
        <QandASection product={product} seedEntries={qaEntries} />
      </div>

      <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />

      {purchasable && (
        <StickyAddToCart
          anchorRef={purchaseAnchorRef}
          product={product}
          variant={activeVariant}
          quantity={quantity}
          price={displayPrice}
        />
      )}
    </div>
  );
}
