import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/email/cron-auth";
import { runAbandonedCartCampaign } from "@/lib/email/abandoned-cart";

/**
 * Invoke on a schedule (e.g. hourly) from an external scheduler — see
 * src/lib/email/cron-auth.ts for the auth header this expects. Each run is
 * safe to repeat: runAbandonedCartCampaign() skips any cart it's already
 * emailed (see hasSentEmailFor in src/lib/admin/email-log-store.ts), so an
 * overlapping or retried invocation never double-sends. A no-op (0 sent)
 * response is normal and expected whenever abandoned-cart emails are
 * turned off in Store Settings, or nothing currently qualifies.
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runAbandonedCartCampaign();
  return NextResponse.json(result);
}
