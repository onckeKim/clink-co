"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { NewsletterContent } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { toast } from "@/components/ui/Toast";

export function NewsletterTab() {
  const [form, setForm] = React.useState<NewsletterContent | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/admin/content/newsletter")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { newsletter?: NewsletterContent } | null) => setForm(data?.newsletter ?? null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save the newsletter copy.");
        return;
      }
      setForm(data.newsletter);
      toast.success("Newsletter copy updated.");
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
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <p className="text-sm text-stone">Shown on the homepage newsletter section.</p>
      <div>
        <Label htmlFor="nl-heading">Heading</Label>
        <Input id="nl-heading" value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="nl-desc">Description</Label>
        <Textarea id="nl-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <Button type="submit" disabled={saving} className="w-fit">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
