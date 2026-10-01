"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { PromoBanner } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";

interface FormState {
  message: string;
  href: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
}

const emptyForm: FormState = { message: "", href: "", active: true, startsAt: "", endsAt: "" };

function fromBanner(banner: PromoBanner): FormState {
  return {
    message: banner.message,
    href: banner.href ?? "",
    active: banner.active,
    startsAt: banner.startsAt ?? "",
    endsAt: banner.endsAt ?? "",
  };
}

export function BannersTab() {
  const [banners, setBanners] = React.useState<PromoBanner[] | null>(null);
  const [editing, setEditing] = React.useState<PromoBanner | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/admin/content/banners")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { banners?: PromoBanner[] } | null) => setBanners(data?.banners ?? []));
  }, []);

  React.useEffect(load, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (banner: PromoBanner) => {
    setForm(fromBanner(banner));
    setEditing(banner);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) {
      toast.error("Enter a banner message.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        message: form.message,
        href: form.href || undefined,
        active: form.active,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
      };
      const res = await fetch(editing ? `/api/admin/content/banners/${editing.id}` : "/api/admin/content/banners", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this banner.");
        return;
      }
      toast.success(editing ? "Banner updated." : "Banner created.");
      closeModal();
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/content/banners/${confirmDeleteId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete this banner.");
        return;
      }
      toast.success("Banner deleted.");
      setConfirmDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  if (banners === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone">No banners yet.</p>
      ) : (
        banners.map((banner) => (
          <div key={banner.id} className="flex items-center gap-4 rounded-2xl border border-sand p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-charcoal">{banner.message}</p>
              {banner.href && <p className="truncate text-xs text-stone">{banner.href}</p>}
            </div>
            {banner.active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>}
            <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(banner)} aria-label="Edit banner">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => setConfirmDeleteId(banner.id)} aria-label="Delete banner">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}

      <Modal open={creating || editing !== null} onClose={closeModal} title={editing ? "Edit banner" : "New banner"} className="max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="banner-message">Message</Label>
            <Input id="banner-message" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="banner-href">Link (optional)</Label>
            <Input id="banner-href" value={form.href} onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))} placeholder="/shop" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="banner-starts">Starts</Label>
              <Input id="banner-starts" type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="banner-ends">Ends</Label>
              <Input id="banner-ends" type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} id="banner-active" />
            <Label htmlFor="banner-active" className="mb-0 normal-case tracking-normal text-charcoal">
              Active
            </Label>
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create banner"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this banner?"
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
