import type { Coupon } from "@/types/coupon";
import { couponsSeed } from "@/data/coupons-seed";

/**
 * In-memory coupons/promotions store — same rationale/pattern as
 * products-store.ts. src/data/coupons.ts re-exports the storefront-facing
 * reads below unchanged (see src/lib/promotions.ts for the
 * validation/application engine that consumes them).
 */

const couponsById = new Map<string, Coupon>(couponsSeed.map((c) => [c.id, structuredClone(c)]));

function generateId(): string {
  return `coup-admin-${crypto.randomUUID().slice(0, 8)}`;
}

function isCodeTaken(code: string, excludeId?: string): boolean {
  const normalized = code.trim().toLowerCase();
  for (const c of couponsById.values()) {
    if (c.code.toLowerCase() === normalized && c.id !== excludeId) return true;
  }
  return false;
}

function readAll(): Coupon[] {
  return [...couponsById.values()];
}

// ---------------------------------------------------------------------------
// Storefront-facing reads — identical names/signatures to the pre-admin
// src/data/coupons.ts, re-exported from there unchanged.
// ---------------------------------------------------------------------------

export function getCoupons(): Coupon[] {
  return readAll();
}

export function getCouponByCode(code: string): Coupon | undefined {
  const normalized = code.trim().toLowerCase();
  return readAll().find((coupon) => coupon.code.toLowerCase() === normalized);
}

/** Automatic discounts only — active, requiresCode: false coupons a shopper never enters a code for. Used by the promotions engine's storefront auto-apply. */
export function getAutomaticCoupons(): Coupon[] {
  return readAll().filter((c) => c.active && !c.requiresCode);
}

/**
 * Increments a coupon's usage counter — a stand-in for a real transactional
 * `UPDATE coupons SET times_used = times_used + 1 WHERE ...` run inside the
 * order-creation transaction. Mutating the in-memory store is a development
 * substitute only: it resets on server restart and isn't safe across
 * multiple server instances — see the orders store for the same caveat.
 */
export function recordCouponUsage(code: string): void {
  const coupon = getCouponByCode(code);
  if (coupon) couponsById.set(coupon.id, { ...coupon, timesUsed: coupon.timesUsed + 1 });
}

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/promotions and /api/admin/coupons/**.
// ---------------------------------------------------------------------------

export function listAdminCoupons(): Coupon[] {
  return readAll().sort((a, b) => a.code.localeCompare(b.code));
}

export function getAdminCouponById(id: string): Coupon | undefined {
  return couponsById.get(id);
}

export type CreateCouponInput = Omit<Coupon, "id" | "timesUsed">;

export type CreateCouponResult = { ok: true; coupon: Coupon } | { ok: false; reason: string };

export function createCoupon(input: CreateCouponInput): CreateCouponResult {
  if (isCodeTaken(input.code)) {
    return { ok: false, reason: `A coupon with the code "${input.code.toUpperCase()}" already exists.` };
  }
  const id = generateId();
  const coupon: Coupon = { ...input, id, code: input.code.trim().toUpperCase(), timesUsed: 0 };
  couponsById.set(id, coupon);
  return { ok: true, coupon };
}

export type UpdateCouponInput = Partial<Omit<Coupon, "id" | "timesUsed">>;

export type UpdateCouponResult = { ok: true; coupon: Coupon } | { ok: false; reason: string };

export function updateCoupon(id: string, patch: UpdateCouponInput): UpdateCouponResult {
  const existing = couponsById.get(id);
  if (!existing) return { ok: false, reason: "Coupon not found." };

  if (patch.code && isCodeTaken(patch.code, id)) {
    return { ok: false, reason: `A coupon with the code "${patch.code.toUpperCase()}" already exists.` };
  }

  const updated: Coupon = { ...existing, ...patch, id, code: (patch.code ?? existing.code).trim().toUpperCase() };
  couponsById.set(id, updated);
  return { ok: true, coupon: updated };
}

export function deleteCoupon(id: string): boolean {
  return couponsById.delete(id);
}
