import type { Metadata } from "next";
import { Logo } from "@/components/layout/Logo";
import { UnsubscribeConfirm } from "@/components/email/UnsubscribeConfirm";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

/** Landed on from the "Unsubscribe" link in a marketing email footer (back-in-stock, wishlist reminder, abandoned cart) — see src/lib/email/unsubscribe.ts. Requires an explicit click to actually unsubscribe (UnsubscribeConfirm), not just visiting the link, so a mail client's link-safety prefetch can't silently unsubscribe someone who never opened the email. */
export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const token = typeof params.token === "string" ? params.token : "";
  const valid = email && token && verifyUnsubscribeToken(email, token);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-porcelain px-6 text-center">
      <Logo />
      <h1 className="font-display max-w-md text-display-lg text-charcoal">Manage your email preferences</h1>
      {valid ? (
        <UnsubscribeConfirm email={email} token={token} />
      ) : (
        <p className="max-w-sm text-sm leading-relaxed text-error">
          This unsubscribe link is invalid or has expired. You can also manage your marketing preferences from your account settings.
        </p>
      )}
    </div>
  );
}
