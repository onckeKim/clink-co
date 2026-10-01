import "server-only";
import {
  deleteReview,
  getReviewByIdForAdmin,
  listReviewsForAdmin,
  updateReviewStatus,
  type AdminReviewRow,
} from "@/lib/db/reviews";
import type { ModerationStatusEnum } from "@/lib/supabase/types";

export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  customerName: string;
  location: string | null;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  status: ModerationStatusEnum;
  helpfulCount: number;
  images: string[];
  createdAt: string;
}

function toAdminReview(row: AdminReviewRow): AdminReview {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? "(deleted product)",
    productSlug: row.products?.slug ?? "",
    customerName: row.customer_name,
    location: row.location,
    rating: row.rating,
    title: row.title,
    body: row.body,
    verified: row.verified,
    status: row.status,
    helpfulCount: row.helpful_count,
    images: row.review_images.map((image) => image.url),
    createdAt: row.created_at,
  };
}

/** The moderation queue — every review regardless of status, optionally filtered to one. */
export async function listReviews(status?: ModerationStatusEnum): Promise<AdminReview[]> {
  const rows = await listReviewsForAdmin(status);
  return rows.map(toAdminReview);
}

export async function getAdminReview(id: string): Promise<AdminReview | null> {
  const row = await getReviewByIdForAdmin(id);
  return row ? toAdminReview(row) : null;
}

/** Publishes or rejects a review. */
export async function moderateReview(id: string, status: "published" | "rejected"): Promise<void> {
  await updateReviewStatus(id, status);
}

export async function removeReview(id: string): Promise<void> {
  await deleteReview(id);
}
