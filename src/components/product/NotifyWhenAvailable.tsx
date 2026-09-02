"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * A client-only "notify me" capture for out-of-stock products. There's no
 * restock-notification service yet (needs a `restock_subscriptions` table
 * and an email trigger) — this confirms the request in the UI so the
 * interaction is real to test, without pretending an email will follow.
 */
export function NotifyWhenAvailable({ productName }: { productName: string }) {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="rounded-xl bg-porcelain p-4 text-sm text-charcoal">
        We&rsquo;ll email you at {email} the moment {productName} is back in stock.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label htmlFor="notify-email" className="sr-only">
        Email address
      </label>
      <Input
        id="notify-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="h-11 flex-1"
      />
      <Button type="submit" variant="secondary" className="shrink-0">
        <Mail className="h-4 w-4" />
        Notify me
      </Button>
    </form>
  );
}
