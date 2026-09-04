import { getProducts } from "@/data/products";

/**
 * Server-side cart validation — re-checks price and stock against the
 * server's own product data rather than trusting whatever the client last
 * had cached. Shared by POST /api/cart/validate (called opportunistically
 * from the cart page) and POST /api/checkout (enforced before an order can
 * be created).
 */

export interface CartLineInput {
  slug: string;
  variantId?: string;
  quantity: number;
}

export type CartLineIssueType =
  | "not-found"
  | "discontinued"
  | "out-of-stock"
  | "insufficient-stock";

export interface CartLineIssue {
  slug: string;
  variantId?: string;
  type: CartLineIssueType;
  message: string;
  availableStock?: number;
}

export interface ValidatedCartLine {
  slug: string;
  variantId?: string;
  productId: string;
  sku: string;
  name: string;
  image: string;
  variantLabel?: string;
  categorySlug: string;
  collectionSlugs: string[];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockQuantity: number;
}

export interface CartValidationResult {
  ok: boolean;
  issues: CartLineIssue[];
  lines: ValidatedCartLine[];
}

export async function validateCartLines(input: CartLineInput[]): Promise<CartValidationResult> {
  const issues: CartLineIssue[] = [];
  const lines: ValidatedCartLine[] = [];

  const productBySlug = new Map((await getProducts()).map((p) => [p.slug, p]));

  for (const item of input) {
    const product = productBySlug.get(item.slug);
    if (!product) {
      issues.push({
        slug: item.slug,
        variantId: item.variantId,
        type: "not-found",
        message: "This product no longer exists.",
      });
      continue;
    }
    if (product.discontinued) {
      issues.push({
        slug: item.slug,
        variantId: item.variantId,
        type: "discontinued",
        message: `${product.name} has been discontinued and can no longer be ordered.`,
      });
      continue;
    }
    if (!product.inStock || product.stockQuantity <= 0) {
      issues.push({
        slug: item.slug,
        variantId: item.variantId,
        type: "out-of-stock",
        message: `${product.name} is out of stock.`,
      });
      continue;
    }
    if (item.quantity > product.stockQuantity) {
      issues.push({
        slug: item.slug,
        variantId: item.variantId,
        type: "insufficient-stock",
        message: `Only ${product.stockQuantity} of ${product.name} left in stock.`,
        availableStock: product.stockQuantity,
      });
    }

    const variant = item.variantId ? product.variants?.find((v) => v.id === item.variantId) : undefined;
    const unitPrice = product.price + (variant?.priceDelta ?? 0);
    const quantity = Math.min(item.quantity, product.stockQuantity);

    lines.push({
      slug: product.slug,
      variantId: variant?.id,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      image: variant?.images?.[0] ?? product.images[0],
      variantLabel: variant?.label,
      categorySlug: product.categorySlug,
      collectionSlugs: product.collectionSlugs,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      stockQuantity: product.stockQuantity,
    });
  }

  return { ok: issues.length === 0, issues, lines };
}
