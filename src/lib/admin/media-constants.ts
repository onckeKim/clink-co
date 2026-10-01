/** Shared between the client uploader (ImageUploader.tsx) and the server route (POST /api/admin/media) — the client check is just for fast feedback; the server re-validates independently since a client check can always be bypassed. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB — data URIs are stored in-memory (see media-store.ts), so this cap keeps the process's memory bounded.
