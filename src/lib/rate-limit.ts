/**
 * In-memory fixed-window rate limiter — a development/demo substitute for a
 * real rate limiter. This is deliberately NOT production-safe: it resets on
 * every server restart/redeploy, and a serverless deployment can run
 * multiple instances that would each hold a different copy of this Map, so
 * the limit only holds within a single process.
 *
 * Moving to production means swapping the body of `checkRateLimit` for a
 * shared store (e.g. Upstash Redis via `@upstash/ratelimit`, or a database
 * table) so every instance enforces the same counter. The call sites below
 * (auth route handlers) are written to match that future shape 1:1 — they
 * just call `checkRateLimit(key, options)` and act on the result.
 */

interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();

// Bound memory: sweep expired windows periodically rather than on every call.
let lastSweep = Date.now();
function sweepExpired(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, state] of windows) {
    if (state.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitOptions {
  /** Maximum requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Checks and increments a fixed-window counter for `key`. Callers should
 * build `key` from the action name plus a caller identifier — e.g.
 * `login:${ip}` or `forgot-password:${email.toLowerCase()}` — so different
 * actions and different callers don't share a budget.
 */
export function checkRateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}

/** Best-effort caller identifier from a Request — a proxy/CDN IP header, falling back to a constant. Good enough to rate-limit-per-caller in this dev setup; a real deployment should trust only its own edge's header. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
