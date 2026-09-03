export interface MediaAsset {
  id: string;
  /** A static /images/... path (seed data) or a data: URI (anything uploaded through the admin dashboard — see media-store.ts for why). */
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  /** Free-form grouping, e.g. "categories", "hero", "products" — shown as the library's folder filter. */
  folder: string;
  labels: string[];
  uploadedAt: string;
  uploadedBy: string;
}
