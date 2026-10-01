import "server-only";
import {
  createReview,
  createReviewImages,
  findVerifiedOrderItem,
  getOwnReviews,
  getPublishedReviews,
  type ReviewWithImages,
} from "@/lib/db/reviews";
import type { Review } from "@/data/reviews";

function toReview(row: ReviewWithImages, product: { slug: string; name: string }): Review {
  return {
    id: row.id,
    customerName: row.customer_name,
    location: row.location ?? "",
    rating: row.rating,
    title: row.title ?? undefined,
    review: row.body,
    productPurchased: product.name,
    productSlug: product.slug,
    verified: row.verified,
    date: row.created_at.slice(0, 10),
    images: row.review_images.map((image) => image.url),
    helpfulCount: row.helpful_count,
  };
}

/**
 * Published reviews for a product, plus (when signed in) that customer's
 * own not-yet-published reviews — so a customer sees their own submission
 * right away, marked pending, without waiting for moderation to publish it.
 * Mirrors what the old local-only submitted-reviews-store gave guests, but
 * backed by the real table for a signed-in account.
 */
export async function getReviewsForProduct(
  product: { id: string; slug: string; name: string },
  viewerUserId: string | null,
): Promise<{ reviews: Review[]; pendingIds: Set<string> }> {
  const published = await getPublishedReviews(product.id);
  if (!viewerUserId) {
    return { reviews: published.map((row) => toReview(row, product)), pendingIds: new Set() };
  }

  const own = await getOwnReviews(viewerUserId, product.id);
  const byId = new Map(published.map((row) => [row.id, row]));
  for (const row of own) byId.set(row.id, row);

  const pendingIds = new Set(own.filter((row) => row.status !== "published").map((row) => row.id));
  const rows = [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { reviews: rows.map((row) => toReview(row, product)), pendingIds };
}

export interface SubmitReviewInput {
  rating: number;
  title?: string;
  body: string;
  customerName: string;
  location?: string;
  images?: string[];
}

/**
 * Writes a signed-in customer's review for real — starts 'pending'
 * (guard_review_write() enforces this server-side regardless of what's
 * sent) and won't appear to other shoppers until staff publish it from
 * /admin. `verified` is computed from the customer's own paid/fulfilled
 * orders, not self-reported like the old WriteReviewForm checkbox.
 */
export async function submitReview(
  userId: string,
  productId: string,
  product: { slug: string; name: string },
  input: SubmitReviewInput,
): Promise<Review> {
  const orderItemId = await findVerifiedOrderItem(userId, productId);
  const row = await createReview({
    product_id: productId,
    user_id: userId,
    order_item_id: orderItemId,
    customer_name: input.customerName.trim() || "Anonymous",
    location: input.location?.trim() || null,
    rating: input.rating,
    title: input.title?.trim() || null,
    body: input.body.trim(),
    verified: orderItemId !== null,
  });

  const images = (input.images ?? []).slice(0, 4);
  if (images.length > 0) await createReviewImages(row.id, images);

  return toReview({ ...row, review_images: images.map((url) => ({ url })) }, product);
}
