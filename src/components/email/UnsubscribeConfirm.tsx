"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

/**
 * Deliberately requires a real click before anything changes — an
 * unsubscribe link that fires on page load would also fire for a mail
 * client's link-safety scanner prefetching the URL, silently
 * unsubscribing people who never opened the email. See src/app/api/unsubscribe/route.ts.
 */
export function UnsubscribeConfirm({ email, token }: { email: string; token: string }) {
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle");

  const handleConfirm = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return <p className="text-sm text-stone">You&apos;ve been unsubscribed from marketing emails. You&apos;ll still receive order-related emails for any purchases you make.</p>;
  }

  if (state === "error") {
    return <p className="text-sm text-error">Something went wrong. Please try again, or contact us if this keeps happening.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-stone">
        Unsubscribe <strong className="text-charcoal">{email}</strong> from marketing emails (back-in-stock alerts, wishlist reminders, cart reminders)?
      </p>
      <Button onClick={handleConfirm} disabled={state === "loading"}>
        {state === "loading" ? "Unsubscribing…" : "Confirm Unsubscribe"}
      </Button>
    </div>
  );
}
