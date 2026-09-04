import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/dal";
import { getOrCreateWishlist, listWishlistProductIds, replaceWishlistItems } from "@/lib/db/wishlist";
import { getProducts } from "@/data/products";
import { dbErrorResponse } from "@/lib/db/errors";
import type { WishlistItem } from "@/store/wishlist-store";

/**
 * The account's saved wishlist, backing wishlist-store.ts's continuous
 * background sync (see useAuthCartSync). wishlist_items only stores
 * product_id, so a read resolves it against the live product catalog to
 * rebuild the denormalized name/image/price the store keeps.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const wishlist = await getOrCreateWishlist(user.id);
    const [productIds, products] = await Promise.all([listWishlistProductIds(wishlist.id), getProducts()]);
    const byId = new Map(products.map((p) => [p.id, p]));
    const items: WishlistItem[] = productIds
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0], price: p.price }));
    return NextResponse.json({ items });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

const putSchema = z.object({ productIds: z.array(z.string().trim().min(1)) });

/** Replaces the account's saved wishlist wholesale with whatever wishlist-store.ts currently holds. */
export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid wishlist." }, { status: 400 });
  }

  try {
    const wishlist = await getOrCreateWishlist(user.id);
    await replaceWishlistItems(wishlist.id, parsed.data.productIds);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
