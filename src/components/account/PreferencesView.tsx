"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import type { ProfileInput } from "@/lib/validations/auth";
import { Switch } from "@/components/ui/Switch";

export function PreferencesView() {
  const [profile, setProfile] = React.useState<ProfileInput | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/account/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { profile?: ProfileInput } | null) => setProfile(data?.profile ?? null));
  }, []);

  const handleToggle = async (marketingConsent: boolean) => {
    if (!profile) return;
    setProfile({ ...profile, marketingConsent });
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, marketingConsent }),
      });
      if (res.ok) setSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Preferences</h1>
        <p className="mt-1.5 text-sm text-stone">Choose what we keep you posted about.</p>
      </div>

      {success && (
        <p className="flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Preferences saved.
        </p>
      )}

      {profile === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-sand/40" />
      ) : (
        <div className="flex flex-col divide-y divide-sand rounded-2xl border border-sand">
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-charcoal">Marketing emails</p>
              <p className="mt-0.5 text-xs text-stone">New arrivals, restocks, offers and the occasional invitation.</p>
            </div>
            <Switch
              checked={profile.marketingConsent}
              onCheckedChange={handleToggle}
              disabled={saving}
              aria-label="Marketing emails"
            />
          </div>
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-charcoal">Order &amp; shipping updates</p>
              <p className="mt-0.5 text-xs text-stone">Confirmations, payment receipts and delivery notices.</p>
            </div>
            <Switch checked disabled onCheckedChange={() => {}} aria-label="Order and shipping updates (always on)" />
          </div>
        </div>
      )}
      <p className="text-xs text-stone">
        Order and shipping emails are transactional and can&apos;t be turned off — you&apos;ll always know the status
        of an order you&apos;ve placed.
      </p>
    </div>
  );
}
