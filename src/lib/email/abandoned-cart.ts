import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { hasSentEmailFor } from "@/lib/admin/email-log-store";
import { sendTransactionalEmail } from "./send";
import { buildUnsubscribeUrl } from "./unsubscribe";
import { abandonedCartReminderTemplate, type EmailProductRef } from "./templates/customer-engagement";

/**
 * The abandoned-cart workflow, split into two layers on purpose:
 *
 *  - selectAbandonedCartRecipients() is a pure function over plain data —
 *    every rule the task asks for ("only with marketing permission",
 *    "don't send immediately", "configurable timing", "not after the
 *    order is completed") lives here, in one place, independently
 *    testable without a database.
 *  - runAbandonedCartCampaign() is the impure shell: it pulls candidates
 *    from Supabase (via the service-role client — a cron job scanning
 *    every customer's cart has no one customer's session to read through
 *    RLS with, the same reasoning as order creation in src/lib/db/orders.ts)
 *    and calls sendTransactionalEmail() for whoever the pure function
 *    selects.
 *
 * This targets the `carts`/`cart_items` tables in supabase/migrations —
 * the app's actual running cart today is client-side (Zustand +
 * localStorage, see src/store/cart-store.ts), which has no server-visible
 * "last touched" timestamp to scan at all. Activating this workflow for
 * real is therefore two changes, neither of which is "write more email
 * code": (1) the checkout/cart flow starts persisting cart state to the
 * `carts` table for signed-in customers (a natural fit once the DAL
 * swap-over documented in supabase/README.md happens), and (2) something
 * calls POST /api/cron/abandoned-cart-emails on a schedule (Vercel Cron,
 * GitHub Actions, or any external scheduler — see that route's own
 * comment). Until then, this module is fully built and unit-testable, just
 * not wired to live cart data.
 */

export interface AbandonedCartCandidate {
  cartId: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  marketingConsent: boolean;
  /** When the cart was last modified (an item added/changed) — the clock the configured delay counts from. */
  cartUpdatedAt: string;
  products: EmailProductRef[];
  cartTotal: number;
  /** The customer's most recent completed (paid/fulfilled) order, if any — used to suppress the reminder once they've converted since this cart was last touched. */
  mostRecentCompletedOrderAt?: string;
}

export interface AbandonedCartConfig {
  enabled: boolean;
  /** Hours of inactivity required before a cart is eligible — Store Settings → Abandoned cart emails. */
  delayHours: number;
}

/**
 * The actual rule set, as pure filtering — see the file header. Takes an
 * explicit `now` for deterministic testing.
 */
export function selectAbandonedCartRecipients(
  candidates: AbandonedCartCandidate[],
  config: AbandonedCartConfig,
  now: Date = new Date(),
): AbandonedCartCandidate[] {
  if (!config.enabled) return [];

  const cutoff = now.getTime() - config.delayHours * 60 * 60 * 1000;

  return candidates.filter((candidate) => {
    // "Only for customers with valid marketing permission."
    if (!candidate.marketingConsent) return false;
    // "Do not send immediately" / respects the admin-configured delay.
    if (new Date(candidate.cartUpdatedAt).getTime() > cutoff) return false;
    if (candidate.products.length === 0) return false;
    // "Do not send after the order is completed" — a completed order
    // placed since the cart was last touched means this cart isn't
    // abandoned, it converted (possibly via a different session/device).
    if (
      candidate.mostRecentCompletedOrderAt &&
      new Date(candidate.mostRecentCompletedOrderAt).getTime() >= new Date(candidate.cartUpdatedAt).getTime()
    ) {
      return false;
    }
    return true;
  });
}

const TEMPLATE_KEY = "abandoned-cart";

/** Fetches candidates from Supabase and sends the reminder to everyone the pure filter above selects, skipping anyone already emailed for this exact cart (see hasSentEmailFor — that's what makes a re-run of the cron job safe). */
export async function runAbandonedCartCampaign(): Promise<{ sent: number; skipped: number; eligible: number }> {
  const settings = await getStoreSettings();
  const config: AbandonedCartConfig = { enabled: settings.abandonedCartEnabled, delayHours: settings.abandonedCartDelayHours };
  if (!config.enabled) return { sent: 0, skipped: 0, eligible: 0 };

  const candidates = await fetchAbandonedCartCandidates(config.delayHours);
  const recipients = selectAbandonedCartRecipients(candidates, config);

  let sent = 0;
  let skipped = 0;

  for (const candidate of recipients) {
    if (hasSentEmailFor(TEMPLATE_KEY, candidate.cartId)) {
      skipped += 1;
      continue;
    }

    const unsubscribeUrl = buildUnsubscribeUrl(candidate.userEmail);
    const content = abandonedCartReminderTemplate(
      {
        firstName: candidate.userFirstName,
        products: candidate.products,
        cartTotal: candidate.cartTotal,
        unsubscribeUrl,
      },
      settings,
    );

    const result = await sendTransactionalEmail({
      to: { name: candidate.userFirstName, email: candidate.userEmail },
      content,
      category: "marketing",
      templateKey: TEMPLATE_KEY,
      unsubscribeUrl,
      relatedEntityType: "cart",
      relatedEntityId: candidate.cartId,
    });

    if (result.ok) sent += 1;
  }

  return { sent, skipped, eligible: recipients.length };
}

/**
 * Reads active carts idle for at least `delayHours`, each customer's
 * marketing consent, and their most recent paid/fulfilled order — via the
 * service-role client, since this scans across every customer rather than
 * one signed-in session's own rows.
 */
async function fetchAbandonedCartCandidates(delayHours: number): Promise<AbandonedCartCandidate[]> {
  const db = createServiceClient();
  if (!db) return [];

  const cutoffIso = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();

  const { data: rawCarts, error: cartsError } = await db
    .from("carts")
    .select("id, user_id, updated_at, cart_items(quantity, unit_price_snapshot, products(name, slug, price, product_images(url, is_primary)))")
    .eq("status", "active")
    .not("user_id", "is", null)
    .lte("updated_at", cutoffIso);

  if (cartsError || !rawCarts || rawCarts.length === 0) return [];

  // Hand-authored types.ts has no Relationships metadata (see the same
  // note in src/lib/db/products.ts), so an embedded select like this one
  // needs an explicit cast on the way out.
  const carts = rawCarts as unknown as Array<{
    id: string;
    user_id: string | null;
    updated_at: string;
    cart_items: Array<{
      quantity: number;
      unit_price_snapshot: number;
      products: { name: string; slug: string; price: number; product_images: { url: string; is_primary: boolean }[] } | null;
    }>;
  }>;

  const userIds = [...new Set(carts.map((c) => c.user_id).filter((id): id is string => Boolean(id)))];
  if (userIds.length === 0) return [];

  const [{ data: profiles }, { data: recentOrders }] = await Promise.all([
    db.from("profiles").select("id, email, first_name, marketing_consent").in("id", userIds),
    db.from("orders").select("user_id, created_at").in("user_id", userIds).in("status", ["paid", "fulfilled"]).order("created_at", { ascending: false }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const latestOrderByUser = new Map<string, string>();
  for (const order of recentOrders ?? []) {
    if (!order.user_id || latestOrderByUser.has(order.user_id)) continue;
    latestOrderByUser.set(order.user_id, order.created_at);
  }

  return carts
    .map((cart): AbandonedCartCandidate | null => {
      if (!cart.user_id) return null;
      const profile = profileById.get(cart.user_id);
      if (!profile?.email) return null;

      const items = cart.cart_items ?? [];

      const products: EmailProductRef[] = items
        .filter((item) => item.products)
        .map((item) => ({
          name: item.products!.name,
          slug: item.products!.slug,
          price: item.products!.price,
          image: item.products!.product_images?.find((img) => img.is_primary)?.url ?? item.products!.product_images?.[0]?.url,
        }));

      const cartTotal = items.reduce((sum, item) => sum + item.unit_price_snapshot * item.quantity, 0);

      return {
        cartId: cart.id,
        userId: cart.user_id,
        userEmail: profile.email,
        userFirstName: profile.first_name || "there",
        marketingConsent: profile.marketing_consent,
        cartUpdatedAt: cart.updated_at,
        products,
        cartTotal,
        mostRecentCompletedOrderAt: latestOrderByUser.get(cart.user_id),
      };
    })
    .filter((c): c is AbandonedCartCandidate => c !== null);
}
