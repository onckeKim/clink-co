import type { MediaAsset } from "@/types/media";
import { mediaSeed } from "@/data/media-seed";
import { getProducts } from "@/lib/admin/products-store";
import { listAdminCategories } from "@/lib/admin/categories-store";
import { listAdminCollections } from "@/lib/admin/collections-store";

/**
 * In-memory media library store — same rationale/pattern as the other admin
 * stores. Uploaded files are kept as `data:` URIs directly on the record
 * (there's no object storage in this dev/demo environment), capped by
 * MAX_IMAGE_SIZE_BYTES (src/lib/admin/media-constants.ts) to keep the
 * process's memory bounded. Products/categories/collections store the
 * image *URL* directly on their own record (pre-dating this library), not a
 * media asset id — so "replace image" swaps this record's url/filename/
 * mimeType/sizeBytes in place (same id, same library entry) but can't
 * retroactively update anywhere the old URL string was already saved; the
 * admin re-picks the new URL on whatever it's used for, same as assigning
 * any other image.
 */

const mediaById = new Map<string, MediaAsset>(mediaSeed.map((m) => [m.id, structuredClone(m)]));

function generateId(): string {
  return `media-admin-${crypto.randomUUID().slice(0, 8)}`;
}

function readAll(): MediaAsset[] {
  return [...mediaById.values()].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export interface MediaFilters {
  search?: string;
  folder?: string;
  label?: string;
}

export function listMedia(filters?: MediaFilters): MediaAsset[] {
  let list = readAll();
  if (filters?.folder) list = list.filter((m) => m.folder === filters.folder);
  if (filters?.label) list = list.filter((m) => m.labels.includes(filters.label!));
  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (m) =>
        m.filename.toLowerCase().includes(q) ||
        m.altText.toLowerCase().includes(q) ||
        m.labels.some((label) => label.toLowerCase().includes(q)),
    );
  }
  return list;
}

export function getMediaById(id: string): MediaAsset | undefined {
  return mediaById.get(id);
}

/** Distinct folder names currently in use — drives the admin UI's folder filter/picker. */
export function listFolders(): string[] {
  return [...new Set(readAll().map((m) => m.folder))].sort((a, b) => a.localeCompare(b));
}

export type CreateMediaInput = {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string;
  folder?: string;
  labels?: string[];
  uploadedBy: string;
};

export function createMedia(input: CreateMediaInput): MediaAsset {
  const id = generateId();
  const asset: MediaAsset = {
    id,
    url: input.url,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    altText: input.altText ?? "",
    folder: input.folder || "uncategorized",
    labels: input.labels ?? [],
    uploadedAt: new Date().toISOString(),
    uploadedBy: input.uploadedBy,
  };
  mediaById.set(id, asset);
  return asset;
}

export type UpdateMediaInput = Partial<Pick<MediaAsset, "altText" | "folder" | "labels">>;

export function updateMedia(id: string, patch: UpdateMediaInput): MediaAsset | undefined {
  const existing = mediaById.get(id);
  if (!existing) return undefined;
  const updated: MediaAsset = { ...existing, ...patch };
  mediaById.set(id, updated);
  return updated;
}

export type ReplaceMediaInput = { url: string; filename: string; mimeType: string; sizeBytes: number };

/** Swaps the file itself (new upload) while keeping the same library entry — same id/folder/labels/altText, new bytes. */
export function replaceMedia(id: string, input: ReplaceMediaInput): MediaAsset | undefined {
  const existing = mediaById.get(id);
  if (!existing) return undefined;
  const updated: MediaAsset = { ...existing, ...input, uploadedAt: new Date().toISOString() };
  mediaById.set(id, updated);
  return updated;
}

async function isUrlReferenced(url: string): Promise<boolean> {
  if (getProducts().some((p) => p.images.includes(url) || p.lifestyleImage === url)) return true;
  const [categories, collections] = await Promise.all([listAdminCategories(), listAdminCollections()]);
  if (categories.some((c) => c.image === url)) return true;
  if (collections.some((c) => c.image === url)) return true;
  return false;
}

export type DeleteMediaResult = { ok: true } | { ok: false; reason: string };

/** Refuses to delete an image still used by a product, category or collection — a real "delete unused image" guard, not just a UI label. */
export async function deleteMedia(id: string): Promise<DeleteMediaResult> {
  const existing = mediaById.get(id);
  if (!existing) return { ok: false, reason: "Media not found." };

  if (await isUrlReferenced(existing.url)) {
    return { ok: false, reason: "This image is still in use by a product, category or collection and can't be deleted." };
  }
  mediaById.delete(id);
  return { ok: true };
}
