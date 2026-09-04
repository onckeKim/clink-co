import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/dal";
import { getOrCreateActiveCart, listCartItems, replaceCartItems } from "@/lib/db/cart";
import { getProducts } from "@/data/products";
import { dbErrorResponse } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";
import type { Product } from "@/types/product";
import type { CartLine } from "@/store/cart-store";

type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"];

/**
 * The account's saved cart, backing cart-store.ts's continuous background
 * sync (see useAuthCartSync) — not the checkout-critical path, which
 * always re-validates the client's in-memory cart independently (see
 * lib/cart-validation.ts). cart_items only stores product_id/variant_id/
 * quantity/a price snapshot, so every read here resolves those against the
 * live product catalog to rebuild the full CartLine shape the store wants.
 */
function toCartLines(rows: CartItemRow[], products: Product[]): CartLine[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: CartLine[] = [];
  for (const row of rows) {
    const product = byId.get(row.product_id);
    if (!product) continue; // product since deleted/unpublished — drop silently, matches cart-validation's "not-found" handling
    const variant = row.variant_id ? product.variants?.find((v) => v.id === row.variant_id) : undefined;
    lines.push({
      lineId: row.variant_id ? `${row.product_id}::${row.variant_id}` : row.product_id,
      productId: row.product_id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      image: variant?.images?.[0] ?? product.images[0],
      price: Number(row.unit_price_snapshot),
      variant: variant ? { id: variant.id, label: variant.label } : undefined,
      quantity: row.quantity,
      categorySlug: product.categorySlug,
      collectionSlugs: product.collectionSlugs,
    });
  }
  return lines;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const cart = await getOrCreateActiveCart(user.id);
    const [rows, products] = await Promise.all([listCartItems(cart.id), getProducts()]);
    return NextResponse.json({ lines: toCartLines(rows, products) });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

const putSchema = z.object({
  lines: z.array(
    z.object({
      productId: z.string().trim().min(1),
      variantId: z.string().trim().min(1).optional(),
      quantity: z.number().int().positive().max(99),
    }),
  ),
});

/**
 * Replaces the account's saved cart wholesale with whatever cart-store.ts
 * currently holds — price and stock are always re-derived from the live
 * product here, never trusted from the request body, same as
 * lib/cart-validation.ts. A line for a product that's gone, or clamped to
 * zero by a stock drop, is silently dropped rather than erroring: this is
 * best-effort continuity syncing, not the checkout gate.
 */
export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  }

  try {
    const [cart, products] = await Promise.all([getOrCreateActiveCart(user.id), getProducts()]);
    const byId = new Map(products.map((p) => [p.id, p]));

    const items = parsed.data.lines
      .map((line) => {
        const product = byId.get(line.productId);
        if (!product) return null;
        const variant = line.variantId ? product.variants?.find((v) => v.id === line.variantId) : undefined;
        const quantity = Math.min(line.quantity, Math.max(product.stockQuantity, 0));
        if (quantity <= 0) return null;
        return {
          productId: line.productId,
          variantId: line.variantId ?? null,
          quantity,
          unitPrice: product.price + (variant?.priceDelta ?? 0),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    await replaceCartItems(cart.id, items);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
