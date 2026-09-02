import type * as React from "react";
import { requireUser } from "@/lib/supabase/dal";
import { ensureProfile } from "@/lib/account/profiles-store";
import { AccountNav } from "@/components/account/AccountNav";

/**
 * Guards every /account/** route: requireUser() redirects to /login if
 * there's no valid session (proxy.ts already does this optimistically from
 * the cookie, but this is the real, server-verified check — see the note
 * in src/proxy.ts). ensureProfile() means every nested page can assume a
 * profile record already exists for this user.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  ensureProfile({ id: user.id, firstName: user.user_metadata?.first_name, lastName: user.user_metadata?.last_name });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="print:hidden lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl border border-sand bg-warm-white p-3">
            <AccountNav />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
