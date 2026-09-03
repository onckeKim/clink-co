import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Typed error hierarchy for the data-access layer (src/lib/db/**). Every
 * function in that layer throws one of these instead of returning a raw
 * Supabase `{ data, error }` pair, so a Route Handler can do exactly one
 * thing at the call site:
 *
 *   try {
 *     const product = await getProductBySlug(slug);
 *     return NextResponse.json({ product });
 *   } catch (err) {
 *     return dbErrorResponse(err);
 *   }
 *
 * `status` is an HTTP status code on purpose — it's meant to be read
 * straight off the error and handed to NextResponse.json(..., { status }),
 * matching the { error, status } shape every existing admin API route
 * already returns (see src/app/api/admin/products/[id]/route.ts).
 */
export class DbError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DbError";
    this.status = status;
  }
}

export class NotFoundError extends DbError {
  constructor(message = "That record doesn't exist.") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/** A unique constraint or usage-limit was violated (duplicate slug/SKU/code, a wishlist share token collision, etc). */
export class ConflictError extends DbError {
  constructor(message = "That already exists.") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

/** A CHECK constraint, a NOT NULL, or a foreign key pointing at something that doesn't exist. */
export class ValidationError extends DbError {
  constructor(message = "That request isn't valid.") {
    super(message, 400);
    this.name = "ValidationError";
  }
}

/** RLS denied the row, or a guard_*() trigger raised its own exception (e.g. "Only a super administrator can change an account's role."). */
export class PermissionError extends DbError {
  constructor(message = "You don't have permission to do that.") {
    super(message, 403);
    this.name = "PermissionError";
  }
}

/** No signed-in session where one is required. */
export class UnauthenticatedError extends DbError {
  constructor(message = "Please sign in to continue.") {
    super(message, 401);
    this.name = "UnauthenticatedError";
  }
}

/** Supabase env vars aren't configured in this environment — see src/lib/supabase/safe-client.ts's AUTH_UNAVAILABLE_MESSAGE for the identical rationale applied to auth specifically. */
export class DatabaseUnavailableError extends DbError {
  constructor(message = "This isn't available right now. Please try again shortly.") {
    super(message, 503);
    this.name = "DatabaseUnavailableError";
  }
}

/**
 * Maps a Postgres/PostgREST error code to the right typed error, reading
 * the same `error.code` values Postgres itself raises (SQLSTATE for a
 * constraint violation; PostgREST's own PGRST* codes for things like "no
 * rows returned by .single()"). A guard_*() trigger's plain
 * `raise exception '...'` has no SQLSTATE of its own (it surfaces as
 * generic '22XXX'/'P0001'), so its message is preserved as-is via the
 * default case rather than mapped to a specific status — 400 is a
 * reasonable default since those are always "this specific write isn't
 * allowed" rather than a server fault.
 */
export function mapPostgrestError(error: PostgrestError): DbError {
  switch (error.code) {
    case "23505": // unique_violation
      return new ConflictError(friendlyConflictMessage(error));
    case "23503": // foreign_key_violation
      return new ValidationError("This refers to something that doesn't exist or has been removed.");
    case "23502": // not_null_violation
    case "23514": // check_violation
      return new ValidationError(error.message);
    case "42501": // insufficient_privilege — RLS denied the row, or a REVOKEd column/command
      return new PermissionError();
    case "PGRST116": // .single()/.maybeSingle() found no row
      return new NotFoundError();
    case "P0001": // plpgsql RAISE EXCEPTION — one of this schema's guard_*() triggers or redeem_discount_code()
      return new ValidationError(error.message);
    default:
      return new DbError(error.message || "Something went wrong.", 500);
  }
}

function friendlyConflictMessage(error: PostgrestError): string {
  if (error.message.includes("orders_order_number_key")) return "That order number is already in use.";
  if (error.message.includes("orders_idempotency_key_key")) return "This request was already processed.";
  if (error.message.includes("products_slug_key")) return "A product with that URL slug already exists.";
  if (error.message.includes("products_sku_key")) return "A product with that SKU already exists.";
  if (error.message.includes("discount_codes_code_key")) return "That discount code already exists.";
  if (error.message.includes("newsletter_subscribers_email_key")) return "That email is already subscribed.";
  return "That already exists.";
}

/**
 * Throws the mapped error if `error` is set, otherwise returns `data` —
 * narrowing it to non-null, since a Supabase `.single()`/`.maybeSingle()`
 * response types `data` as nullable even though "no row" is really an
 * error case (PGRST116) for `.single()`, or a legitimate empty result for
 * `.maybeSingle()` (pass `allowNull: true` there instead of calling this).
 */
export function unwrap<T>({ data, error }: { data: T | null; error: PostgrestError | null }): T {
  if (error) throw mapPostgrestError(error);
  if (data === null) throw new NotFoundError();
  return data;
}

/** Same as unwrap(), but a null result is a legitimate "not found" rather than an error — for .maybeSingle() reads. */
export function unwrapNullable<T>({ data, error }: { data: T | null; error: PostgrestError | null }): T | null {
  if (error) throw mapPostgrestError(error);
  return data;
}
