"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side auth state for UI that needs to react to sign-in/sign-out
 * without a full page reload (e.g. the header's account icon). Not a
 * security boundary — every protected page and API route re-verifies the
 * session server-side regardless of what this hook reports.
 */
export function useAuthUser() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Deferred into a promise chain (rather than a synchronous try/catch)
    // so every state update below happens inside a `.then()`/`.catch()`
    // callback, not synchronously during the effect body itself.
    Promise.resolve()
      .then(() => createClient())
      .then((supabase) => {
        supabase.auth.getUser().then(({ data }) => {
          setUser(data.user);
          setLoading(false);
        });

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
        unsubscribe = () => subscription.subscription.unsubscribe();
      })
      .catch(() => {
        // Supabase env vars aren't set in this environment.
        setLoading(false);
      });

    return () => unsubscribe?.();
  }, []);

  return { user, loading };
}
