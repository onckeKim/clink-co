import "server-only";
import { getDb } from "./client";
import { mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database, ModerationStatusEnum } from "@/lib/supabase/types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewImageInsert = Database["public"]["Tables"]["review_images"]["Insert"];

export interface ReviewWithImages extends ReviewRow {
  review_images: { url: string }[];
}

export interface AdminReviewRow extends ReviewWithImages {
  products: { name: string; slug: string } | null;
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

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/reviews and /api/admin/reviews/**.
// RLS (reviews_select_staff) restricts these to a session with content:view;
// guard_review_write() additionally restricts the status update itself to
// content:write, mirroring the API route's own permission check.
// ---------------------------------------------------------------------------

/** Every review regardless of status, newest first, with its product's name/slug for display — the moderation queue. */
export async function listReviewsForAdmin(status?: ModerationStatusEnum): Promise<AdminReviewRow[]> {
  const db = await getDb();
  let query = db
    .from("reviews")
    .select("*, review_images(url), products(name, slug)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  return unwrap({ data, error }) as unknown as AdminReviewRow[];
}

export async function getReviewByIdForAdmin(id: string): Promise<AdminReviewRow | null> {
  const db = await getDb();
  const { data, error } = await db
    .from("reviews")
    .select("*, review_images(url), products(name, slug)")
    .eq("id", id)
    .maybeSingle();
  const row = unwrapNullable({ data, error });
  return row ? (row as unknown as AdminReviewRow) : null;
}

/** Publishes or rejects a review — the row's `status` change alone; guard_review_write() rejects this outright for a session without content:write. */
export async function updateReviewStatus(id: string, status: "published" | "rejected"): Promise<ReviewRow> {
  const db = await getDb();
  const { data, error } = await db.from("reviews").update({ status }).eq("id", id).select().single();
  return unwrap({ data, error });
}

/** Removes a review outright (spam/abuse) — review_images cascade with it. */
export async function deleteReview(id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("reviews").delete().eq("id", id);
  if (error) throw mapPostgrestError(error);
}
