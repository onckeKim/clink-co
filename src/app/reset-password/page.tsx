import Link from "next/link";
import type { Metadata } from "next";
import { getUser } from "@/lib/supabase/dal";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Set New Password",
};

export default async function ResetPasswordPage() {
  // Requires the session established by following the emailed recovery
  // link (see /auth/confirm). No session here means the link was already
  // used, expired, or this page was opened directly — request a new one.
  const user = await getUser();

  if (!user) {
    return (
      <AuthShell title="This link has expired">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-stone">
            Password reset links are only valid for a short time. Request a new one to continue.
          </p>
          <Link
            href="/forgot-password"
            className="focus-ring text-sm font-medium text-charcoal underline-offset-2 hover:underline"
          >
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return <ResetPasswordForm />;
}
