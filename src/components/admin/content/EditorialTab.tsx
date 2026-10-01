"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { EditorialSection } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { toast } from "@/components/ui/Toast";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";

export function EditorialTab() {
  const [form, setForm] = React.useState<EditorialSection | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/admin/content/editorial")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { editorial?: EditorialSection } | null) => setForm(data?.editorial ?? null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content/editorial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save the editorial section.");
        return;
      }
      setForm(data.editorial);
      toast.success("Editorial section updated.");
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
      <p className="text-sm text-stone">The homepage&apos;s single editorial/lifestyle feature section.</p>
      <div>
        <Label htmlFor="ed-eyebrow">Eyebrow</Label>
        <Input id="ed-eyebrow" value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="ed-title">Title</Label>
        <Input id="ed-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="ed-desc">Description</Label>
        <Textarea id="ed-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ed-cta-label">CTA label</Label>
          <Input id="ed-cta-label" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="ed-cta-href">CTA link</Label>
          <Input id="ed-cta-href" value={form.ctaHref} onChange={(e) => setForm({ ...form, ctaHref: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Image</Label>
        <SingleImageUploader value={form.image} onChange={(url) => setForm({ ...form, image: url })} folder="editorial" />
      </div>
      <div>
        <Label htmlFor="ed-alt">Image alt text</Label>
        <Input id="ed-alt" value={form.imageAlt} onChange={(e) => setForm({ ...form, imageAlt: e.target.value })} />
      </div>
      <Button type="submit" disabled={saving} className="w-fit">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
