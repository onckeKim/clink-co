"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { CuratedCollection } from "@/types/collection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";

interface CollectionFormState {
  name: string;
  description: string;
  image: string;
  id: string;
}

const emptyForm: CollectionFormState = { name: "", description: "", image: "", id: "" };

export function CollectionsListView() {
  const [collections, setCollections] = React.useState<CuratedCollection[] | null>(null);
  const [editing, setEditing] = React.useState<CuratedCollection | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState<CollectionFormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/admin/collections")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { collections?: CuratedCollection[] } | null) => setCollections(data?.collections ?? []));
  }, []);

  React.useEffect(load, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (collection: CuratedCollection) => {
    setForm({ name: collection.name, description: collection.description, image: collection.image, id: collection.id });
    setEditing(collection);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.image) {
      toast.error("Name, description and image are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/collections/${editing.id}` : "/api/admin/collections", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? { name: form.name, description: form.description, image: form.image }
            : { name: form.name, description: form.description, image: form.image, id: form.id || undefined },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this collection.");
        return;
      }
      toast.success(editing ? "Collection updated." : "Collection created.");
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
      const res = await fetch(`/api/admin/collections/${confirmDeleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't delete this collection.");
        return;
      }
      toast.success("Collection deleted.");
      setConfirmDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-charcoal">Collections</h1>
          <p className="mt-1.5 text-sm text-stone">
            Assign products to a collection from the product form&apos;s Organization tab.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New collection
        </Button>
      </div>

      {collections === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div key={collection.id} className="overflow-hidden rounded-2xl border border-sand">
              <div className="relative aspect-[4/3] bg-sand/30">
                <Image
                  src={collection.image}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                  unoptimized={collection.image.startsWith("data:")}
                />
              </div>
              <div className="p-4">
                <p className="font-medium text-charcoal">{collection.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-stone">{collection.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(collection)} className="flex-1">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDeleteId(collection.id)}
                    aria-label="Delete collection"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating || editing !== null} onClose={closeModal} title={editing ? "Edit collection" : "New collection"} className="max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <Label htmlFor="coll-name">Name</Label>
            <Input id="coll-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          {!editing && (
            <div>
              <Label htmlFor="coll-id">Slug</Label>
              <Input
                id="coll-id"
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                placeholder="auto-generated from name if left blank"
              />
            </div>
          )}
          <div>
            <Label htmlFor="coll-desc">Description</Label>
            <Textarea id="coll-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          </div>
          <div>
            <Label>Image</Label>
            <SingleImageUploader value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} folder="collections" />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create collection"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this collection?"
        description="Products assigned to this collection stay untouched — they just stop appearing under it."
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
