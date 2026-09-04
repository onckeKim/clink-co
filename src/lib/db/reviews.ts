import "server-only";
import { getDb } from "./client";
import { mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database } from "@/lib/supabase/types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewImageInsert = Database["public"]["Tables"]["review_images"]["Insert"];

export interface ReviewWithImages extends ReviewRow {
  review_images: { url: string }[];
}

/** Published reviews for a product, newest first, with any attached photos — RLS (reviews_select_published) already restricts anon/authenticated to `status = 'published'`; this repeats it for index use and readability. */
export async function getPublishedReviews(productId: string): Promise<ReviewWithImages[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("reviews")
    .select("*, review_images(url)")
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return unwrap({ data, error }) as unknown as ReviewWithImages[];
}

/** A signed-in customer's own reviews across every product, most recent first — used to show "your review is pending" state without waiting for moderation. */
export async function getOwnReviews(userId: string, productId: string): Promise<ReviewWithImages[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("reviews")
    .select("*, review_images(url)")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  return unwrap({ data, error }) as unknown as ReviewWithImages[];
}

/**
 * A signed-in customer's own review. Whatever `status` this is called
 * with, the row lands as 'pending' regardless — guard_review_write()
 * (0006_reviews_and_qa.sql) overwrites it server-side unless the caller's
 * session holds content:write, so there's no way to self-publish by
 * passing status: 'published' here.
 */
export async function createReview(input: ReviewInsert): Promise<ReviewRow> {
  const db = await getDb();
  const { data, error } = await db.from("reviews").insert(input).select().single();
  return unwrap({ data, error });
}

export async function createReviewImages(reviewId: string, urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  const db = await getDb();
  const rows: ReviewImageInsert[] = urls.map((url, index) => ({ review_id: reviewId, url, sort_order: index }));
  const { error } = await db.from("review_images").insert(rows);
  if (error) throw mapPostgrestError(error);
}

/**
 * The most recent paid/fulfilled order_item this user bought of this
 * product — backs the real "Verified Purchase" badge (reviews.order_item_id),
 * replacing WriteReviewForm's old self-attested checkbox for signed-in
 * submissions.
 */
export async function findVerifiedOrderItem(userId: string, productId: string): Promise<string | null> {
  const db = await getDb();
  const { data, error } = await db
    .from("order_items")
    .select("id, orders!inner(user_id, status)")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .in("orders.status", ["paid", "fulfilled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = unwrapNullable({ data, error }) as { id: string } | null;
  return row?.id ?? null;
}
