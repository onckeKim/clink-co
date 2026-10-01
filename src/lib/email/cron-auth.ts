import "server-only";

/**
 * Every /api/cron/** route checks this before doing anything — these
 * endpoints trigger real email sends across every customer in the store,
 * so they must never be reachable by an anonymous request. Point your
 * scheduler (Vercel Cron, a GitHub Actions workflow, any external cron
 * service) at the route with `Authorization: Bearer <CRON_SECRET>`.
 *
 * With CRON_SECRET unset, every cron route refuses to run (fails closed)
 * rather than silently accepting unauthenticated requests — see
 * .env.local.example.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
