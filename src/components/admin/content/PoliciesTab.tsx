"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { PolicyPageContent, PolicyPageKey } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Tabs } from "@/components/ui/Tabs";
import { toast } from "@/components/ui/Toast";
import { SectionsEditor } from "@/components/admin/content/SectionsEditor";

const POLICY_TABS: { id: PolicyPageKey; label: string }[] = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Service" },
  { id: "cookie-policy", label: "Cookie Policy" },
];

/** Keyed by `policyKey` from the parent so switching policies remounts this (a fresh fetch + loading state) instead of resetting state inside an effect. */
function PolicyForm({ policyKey }: { policyKey: PolicyPageKey }) {
  const [form, setForm] = React.useState<PolicyPageContent | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/admin/content/policies/${policyKey}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { policy?: PolicyPageContent } | null) => setForm(data?.policy ?? null));
  }, [policyKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/policies/${policyKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, updatedAt: new Date().toISOString().slice(0, 10) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this policy page.");
        return;
      }
      setForm(data.policy);
      toast.success("Policy page updated.");
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
      <div>
        <Label htmlFor="policy-title">Title</Label>
        <Input id="policy-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="policy-intro">Intro</Label>
        <Textarea id="policy-intro" value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} />
      </div>
      <div>
        <Label>Sections</Label>
        <SectionsEditor sections={form.sections} onChange={(sections) => setForm({ ...form, sections })} />
      </div>
      <Button type="submit" disabled={saving} className="w-fit">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}

export function PoliciesTab() {
  const [key, setKey] = React.useState<PolicyPageKey>("privacy");

  return (
    <div className="flex flex-col gap-5">
      <Tabs items={POLICY_TABS} value={key} onChange={(id) => setKey(id as PolicyPageKey)} />
      <PolicyForm key={key} policyKey={key} />
    </div>
  );
}
