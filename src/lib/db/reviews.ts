import "server-only";
import { getDb } from "./client";
import { unwrap } from "./errors";
import type { Database } from "@/lib/supabase/types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];

/** Published reviews for a product — RLS (reviews_select_published) already restricts anon/authenticated to `status = 'published'`; this repeats it for index use and readability. */
export async function getPublishedReviews(productId: string): Promise<ReviewRow[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return unwrap({ data, error });
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
