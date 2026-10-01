import type { MediaAsset } from "@/types/media";

/**
 * Seed data for the media library store (src/lib/admin/media-store.ts) —
 * the pre-existing static images the storefront already ships with,
 * catalogued so the library isn't empty on first admin visit. Individual
 * product photography (src/data/products-seed.ts) isn't re-catalogued here
 * one-by-one; it's still referenced directly by URL from each product
 * record, same as these.
 */
const seedAt = "2025-01-01T00:00:00.000Z";
const seedUploader = "system-seed";

function svgAsset(input: Omit<MediaAsset, "id" | "mimeType" | "sizeBytes" | "uploadedAt" | "uploadedBy">): MediaAsset {
  return {
    ...input,
    id: `media-${input.filename.replace(/\.[^.]+$/, "")}`,
    mimeType: "image/svg+xml",
    sizeBytes: 4096,
    uploadedAt: seedAt,
    uploadedBy: seedUploader,
  };
}

export const mediaSeed: MediaAsset[] = [
  svgAsset({
    url: "/images/categories/glassware.svg",
    filename: "glassware.svg",
    altText: "Coupes, tumblers and stemware arranged on a table",
    folder: "categories",
    labels: ["category"],
  }),
  svgAsset({
    url: "/images/categories/barware.svg",
    filename: "barware.svg",
    altText: "Shakers, jiggers and bar tools",
    folder: "categories",
    labels: ["category"],
  }),
  svgAsset({
    url: "/images/categories/tableware.svg",
    filename: "tableware.svg",
    altText: "Plates, bowls and table linens",
    folder: "categories",
    labels: ["category"],
  }),
  svgAsset({
    url: "/images/categories/serveware.svg",
    filename: "serveware.svg",
    altText: "Decanters, trays and ice buckets",
    folder: "categories",
    labels: ["category"],
  }),
  svgAsset({
    url: "/images/categories/gift-sets.svg",
    filename: "gift-sets.svg",
    altText: "Boxed and ribboned gift sets",
    folder: "categories",
    labels: ["category"],
  }),
  svgAsset({
    url: "/images/categories/accessories.svg",
    filename: "accessories.svg",
    altText: "Candles, coasters and small accessories",
    folder: "categories",
    labels: ["category"],
  }),
  svgAsset({
    url: "/images/collection-home-bar.svg",
    filename: "collection-home-bar.svg",
    altText: "The Home Bar Edit collection cover",
    folder: "collections",
    labels: ["collection"],
  }),
  svgAsset({
    url: "/images/collection-everyday-elegance.svg",
    filename: "collection-everyday-elegance.svg",
    altText: "Everyday Elegance collection cover",
    folder: "collections",
    labels: ["collection"],
  }),
  svgAsset({
    url: "/images/collection-gifts-worth-giving.svg",
    filename: "collection-gifts-worth-giving.svg",
    altText: "Gifts Worth Giving collection cover",
    folder: "collections",
    labels: ["collection"],
  }),
  svgAsset({
    url: "/images/hero-table.svg",
    filename: "hero-table.svg",
    altText: "A set table styled for entertaining",
    folder: "hero",
    labels: ["homepage"],
  }),
  svgAsset({
    url: "/images/hero-bar-cart.svg",
    filename: "hero-bar-cart.svg",
    altText: "A styled home bar cart",
    folder: "hero",
    labels: ["homepage"],
  }),
  svgAsset({
    url: "/images/hero-gifting.svg",
    filename: "hero-gifting.svg",
    altText: "Wrapped gift boxes ready to give",
    folder: "hero",
    labels: ["homepage"],
  }),
  svgAsset({
    url: "/images/editorial-hosting.svg",
    filename: "editorial-hosting.svg",
    altText: "Editorial photography for The Art of Hosting Well",
    folder: "editorial",
    labels: ["homepage"],
  }),
  svgAsset({
    url: "/images/lifestyle-glass.svg",
    filename: "lifestyle-glass.svg",
    altText: "Lifestyle photography featuring glassware",
    folder: "lifestyle",
    labels: ["pdp"],
  }),
  svgAsset({
    url: "/images/lifestyle-gift.svg",
    filename: "lifestyle-gift.svg",
    altText: "Lifestyle photography featuring a gift set",
    folder: "lifestyle",
    labels: ["pdp"],
  }),
  svgAsset({
    url: "/images/social-1.svg",
    filename: "social-1.svg",
    altText: "Customer social gallery photo 1",
    folder: "social",
    labels: ["social-gallery"],
  }),
  svgAsset({
    url: "/images/social-2.svg",
    filename: "social-2.svg",
    altText: "Customer social gallery photo 2",
    folder: "social",
    labels: ["social-gallery"],
  }),
  svgAsset({
    url: "/images/social-3.svg",
    filename: "social-3.svg",
    altText: "Customer social gallery photo 3",
    folder: "social",
    labels: ["social-gallery"],
  }),
  svgAsset({
    url: "/images/social-4.svg",
    filename: "social-4.svg",
    altText: "Customer social gallery photo 4",
    folder: "social",
    labels: ["social-gallery"],
  }),
  svgAsset({
    url: "/images/social-5.svg",
    filename: "social-5.svg",
    altText: "Customer social gallery photo 5",
    folder: "social",
    labels: ["social-gallery"],
  }),
  svgAsset({
    url: "/images/social-6.svg",
    filename: "social-6.svg",
    altText: "Customer social gallery photo 6",
    folder: "social",
    labels: ["social-gallery"],
  }),
];
