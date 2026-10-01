"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const SOCIAL_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN === "true";

/**
 * Social login structure — real and wired, but only rendered when
 * NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true, since it also requires the Google
 * provider to be turned on in the Supabase dashboard (Authentication ->
 * Providers), which this codebase can't configure for you. See the
 * README's auth setup section for the exact steps. Until then this
 * component renders nothing, so login/signup stay email/password-only.
 */
export function SocialLoginButtons() {
  const [loading, setLoading] = React.useState(false);

  if (!SOCIAL_LOGIN_ENABLED) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // No setLoading(false) here — a successful call navigates the browser
    // away to Google immediately, so the spinner just rides out the redirect.
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-stone">
        <span className="h-px flex-1 bg-sand" />
        or continue with
        <span className="h-px flex-1 bg-sand" />
      </div>

      <Button type="button" variant="secondary" size="lg" disabled={loading} onClick={handleGoogleLogin}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.37l4.01-3.09Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.63l4.01 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
            />
          </svg>
        )}
        Continue with Google
      </Button>
    </div>
  );
}
