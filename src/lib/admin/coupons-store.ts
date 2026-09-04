import "server-only";
import type { Coupon } from "@/types/coupon";
import * as db from "@/lib/db/discounts";
import { listAllCollections } from "@/lib/db/collections";
import { ConflictError } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";

type DiscountCodeRow = Database["public"]["Tables"]["discount_codes"]["Row"];
type DiscountCodeInsert = Database["public"]["Tables"]["discount_codes"]["Insert"];

/**
 * Async wrapper over src/lib/db/discounts.ts (the real `discount_codes`
 * table). collectionSlugs round-trips through collection_ids (a uuid[]
 * pointing at the now-migrated collections table); productSlugs does not —
 * see the doc comment on Coupon.productSlugs for why.
 */

async function collectionSlugMaps(): Promise<{ idToSlug: Map<string, string>; slugToId: Map<string, string> }> {
  const collections = await listAllCollections();
  return {
    idToSlug: new Map(collections.map((c) => [c.id, c.slug])),
    slugToId: new Map(collections.map((c) => [c.slug, c.id])),
  };
}

function resolveCollectionIds(slugs: string[] | undefined, slugToId: Map<string, string>): string[] {
  if (!slugs?.length) return [];
  return slugs.map((slug) => slugToId.get(slug)).filter((id): id is string => Boolean(id));
}

function fromRow(row: DiscountCodeRow, idToSlug: Map<string, string>): Coupon {
  const collectionSlugs = row.collection_ids.map((id) => idToSlug.get(id)).filter((slug): slug is string => Boolean(slug));
  return {
    id: row.id,
    code: row.code,
    description: row.description ?? "",
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    freeDelivery: row.free_delivery,
    minSpend: row.min_spend !== null ? Number(row.min_spend) : undefined,
    startsAt: row.starts_at ? row.starts_at.slice(0, 10) : undefined,
    endsAt: row.ends_at ? row.ends_at.slice(0, 10) : undefined,
    collectionSlugs: collectionSlugs.length ? collectionSlugs : undefined,
    customerEmails: row.customer_emails.length ? row.customer_emails : undefined,
    usageLimit: row.usage_limit ?? undefined,
    timesUsed: row.times_used,
    active: row.active,
    requiresCode: row.requires_code,
  };
}

// ---------------------------------------------------------------------------
// Storefront-facing reads — identical names/signatures to the pre-admin
// src/data/coupons.ts, re-exported from there unchanged. Backed by
// getUsableDiscountCodes(), which RLS already restricts to codes that are
// active, inside their date window, and under their usage limit.
// ---------------------------------------------------------------------------

export async function getCoupons(): Promise<Coupon[]> {
  const [rows, { idToSlug }] = await Promise.all([db.getUsableDiscountCodes(), collectionSlugMaps()]);
  return rows.map((row) => fromRow(row, idToSlug));
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const normalized = code.trim().toLowerCase();
  const coupons = await getCoupons();
  return coupons.find((coupon) => coupon.code.toLowerCase() === normalized);
}

/** Automatic discounts only — active, requiresCode: false coupons a shopper never enters a code for. Used by the promotions engine's storefront auto-apply. */
export async function getAutomaticCoupons(): Promise<Coupon[]> {
  const coupons = await getCoupons();
  return coupons.filter((c) => !c.requiresCode);
}

/**
 * Atomically redeems a discount code against an order — see
 * db.redeemDiscountCode()'s doc comment for the row-locking guarantee this
 * gives over the old in-memory usage counter.
 */
export async function redeemCoupon(input: {
  code: string;
  orderId: string;
  userId: string | null;
  customerEmail: string;
  amountDiscounted: number;
}): Promise<void> {
  await db.redeemDiscountCode(input);
}

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/promotions and /api/admin/coupons/**.
// ---------------------------------------------------------------------------

export async function listAdminCoupons(): Promise<Coupon[]> {
  const [rows, { idToSlug }] = await Promise.all([db.listAllDiscountCodes(), collectionSlugMaps()]);
  return rows.map((row) => fromRow(row, idToSlug));
}

export async function getAdminCouponById(id: string): Promise<Coupon | undefined> {
  const [row, { idToSlug }] = await Promise.all([db.getDiscountCodeById(id), collectionSlugMaps()]);
  return row ? fromRow(row, idToSlug) : undefined;
}

export type CreateCouponInput = Omit<Coupon, "id" | "timesUsed">;
export type CreateCouponResult = { ok: true; coupon: Coupon } | { ok: false; reason: string };

export async function createCoupon(input: CreateCouponInput): Promise<CreateCouponResult> {
  const { slugToId, idToSlug } = await collectionSlugMaps();
  const insert: DiscountCodeInsert = {
    code: input.code.trim().toUpperCase(),
    description: input.description,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    free_delivery: input.freeDelivery,
    min_spend: input.minSpend ?? null,
    starts_at: input.startsAt ? `${input.startsAt}T00:00:00Z` : null,
    ends_at: input.endsAt ? `${input.endsAt}T23:59:59Z` : null,
    collection_ids: resolveCollectionIds(input.collectionSlugs, slugToId),
    customer_emails: input.customerEmails ?? [],
    usage_limit: input.usageLimit ?? null,
    requires_code: input.requiresCode,
    active: input.active,
  };
  try {
    const row = await db.createDiscountCode(insert);
    return { ok: true, coupon: fromRow(row, idToSlug) };
  } catch (err) {
    if (err instanceof ConflictError) return { ok: false, reason: err.message };
    throw err;
  }
}

export type UpdateCouponInput = Partial<Omit<Coupon, "id" | "timesUsed">>;
export type UpdateCouponResult = { ok: true; coupon: Coupon } | { ok: false; reason: string };

export async function updateCoupon(id: string, patch: UpdateCouponInput): Promise<UpdateCouponResult> {
  const { slugToId, idToSlug } = await collectionSlugMaps();
  const update: Database["public"]["Tables"]["discount_codes"]["Update"] = {
    code: patch.code ? patch.code.trim().toUpperCase() : undefined,
    description: patch.description,
    discount_type: patch.discountType,
    discount_value: patch.discountValue,
    free_delivery: patch.freeDelivery,
    min_spend: patch.minSpend !== undefined ? patch.minSpend : undefined,
    starts_at: patch.startsAt !== undefined ? (patch.startsAt ? `${patch.startsAt}T00:00:00Z` : null) : undefined,
    ends_at: patch.endsAt !== undefined ? (patch.endsAt ? `${patch.endsAt}T23:59:59Z` : null) : undefined,
    collection_ids: patch.collectionSlugs !== undefined ? resolveCollectionIds(patch.collectionSlugs, slugToId) : undefined,
    customer_emails: patch.customerEmails,
    usage_limit: patch.usageLimit !== undefined ? patch.usageLimit : undefined,
    requires_code: patch.requiresCode,
    active: patch.active,
  };
  try {
    const row = await db.updateDiscountCode(id, update);
    return { ok: true, coupon: fromRow(row, idToSlug) };
  } catch (err) {
    if (err instanceof ConflictError) return { ok: false, reason: err.message };
    throw err;
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  await db.deleteDiscountCode(id);
}
