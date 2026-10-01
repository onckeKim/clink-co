"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Search, Trash2 } from "lucide-react";
import type { MediaAsset } from "@/types/media";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { TagListInput } from "@/components/admin/products/TagListInput";
import { toast } from "@/components/ui/Toast";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminMediaLibraryView() {
  const [media, setMedia] = React.useState<MediaAsset[] | null>(null);
  const [folders, setFolders] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [folder, setFolder] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [selected, setSelected] = React.useState<MediaAsset | null>(null);
  const [altText, setAltText] = React.useState("");
  const [editFolder, setEditFolder] = React.useState("");
  const [labels, setLabels] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [replacing, setReplacing] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (folder) params.set("folder", folder);
    fetch(`/api/admin/media?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { media?: MediaAsset[] } | null) => {
        const list = data?.media ?? [];
        setMedia(list);
        setFolders((prev) => [...new Set([...prev, ...list.map((m) => m.folder)])].sort());
      });
  }, [search, folder]);

  React.useEffect(() => {
    const id = window.setTimeout(load, 250);
    return () => window.clearTimeout(id);
  }, [load]);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const dataUrl = await fileToDataUrl(file);
        const res = await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, filename: file.name, mimeType: file.type, sizeBytes: file.size, folder: folder || "uncategorized" }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error ?? `Couldn't upload ${file.name}.`);
        }
      }
      toast.success("Upload complete.");
      load();
    } finally {
      setUploading(false);
    }
  };

  const openDetail = (asset: MediaAsset) => {
    setSelected(asset);
    setAltText(asset.altText);
    setEditFolder(asset.folder);
    setLabels(asset.labels);
  };

  const closeDetail = () => setSelected(null);

  const handleSaveDetails = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/media/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText, folder: editFolder, labels }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save these details.");
        return;
      }
      toast.success("Media details updated.");
      closeDetail();
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleReplace = async ([file]: File[]) => {
    if (!file || !selected) return;
    setReplacing(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch(`/api/admin/media/${selected.id}/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, filename: file.name, mimeType: file.type, sizeBytes: file.size }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't replace this image.");
        return;
      }
      toast.success("Image replaced.");
      setSelected(data.media);
      load();
    } finally {
      setReplacing(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${selected.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "This image can't be deleted.");
        return;
      }
      toast.success("Image deleted.");
      setConfirmDelete(false);
      closeDetail();
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Media Library</h1>
        <p className="mt-1.5 text-sm text-stone">Every image uploaded through the admin dashboard.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by filename, alt text or label" className="pl-11" />
        </div>
        <Select value={folder} onChange={(e) => setFolder(e.target.value)} className="w-auto min-w-[160px]">
          <option value="">All folders</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </div>

      <ImageUploader onFiles={handleUpload} uploading={uploading} onReject={(rejected) => rejected.forEach((r) => toast.error(`${r.file.name}: ${r.reason}`))} />

      {media === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : media.length === 0 ? (
        <p className="py-16 text-center text-sm text-stone">No images match these filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {media.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => openDetail(asset)}
              className="focus-ring group overflow-hidden rounded-2xl border border-sand text-left"
            >
              <div className="relative aspect-square bg-sand/30">
                <Image src={asset.url} alt={asset.altText} fill sizes="200px" className="object-cover" unoptimized={asset.url.startsWith("data:")} />
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-charcoal">{asset.filename}</p>
                <p className="truncate text-[11px] text-stone">{asset.folder}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={selected !== null} onClose={closeDetail} title={selected?.filename} className="max-w-lg">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-sand/30">
              <Image src={selected.url} alt={selected.altText} fill sizes="480px" className="object-contain" unoptimized={selected.url.startsWith("data:")} />
            </div>
            <p className="text-xs text-stone">
              {selected.mimeType} · {formatBytes(selected.sizeBytes)}
            </p>

            <div>
              <Label htmlFor="media-alt">Alt text</Label>
              <Input id="media-alt" value={altText} onChange={(e) => setAltText(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="media-folder">Folder</Label>
              <Input id="media-folder" value={editFolder} onChange={(e) => setEditFolder(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="media-labels">Labels</Label>
              <TagListInput values={labels} onChange={setLabels} placeholder="Type a label, press Enter" />
            </div>

            <Button type="button" onClick={handleSaveDetails} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save details
            </Button>

            <div className="border-t border-sand pt-4">
              <Label>Replace image</Label>
              <ImageUploader onFiles={handleReplace} multiple={false} uploading={replacing} />
            </div>

            <Button type="button" variant="secondary" className="mt-2 text-error" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Delete image
            </Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this image?"
        description="Images still used by a product, category or collection can't be deleted."
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
