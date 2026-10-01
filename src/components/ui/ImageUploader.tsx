"use client";

import * as React from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/admin/media-constants";

/** Drag-and-drop (or click-to-browse) multi-file image picker. Validates type/size client-side for fast feedback and calls `onFiles` with only the files that passed; `onReject` reports anything skipped so the caller can surface why. Doesn't upload anything itself — the media library page owns the actual POST /api/admin/media call. */
export function ImageUploader({
  onFiles,
  onReject,
  multiple = true,
  uploading = false,
  className,
}: {
  onFiles: (files: File[]) => void;
  onReject?: (rejected: { file: File; reason: string }[]) => void;
  multiple?: boolean;
  uploading?: boolean;
  className?: string;
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted: File[] = [];
    const rejected: { file: File; reason: string }[] = [];

    for (const file of fileList) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        rejected.push({ file, reason: "Unsupported file type." });
      } else if (file.size > MAX_IMAGE_SIZE_BYTES) {
        rejected.push({ file, reason: `Larger than ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.` });
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length) onFiles(accepted);
    if (rejected.length) onReject?.(rejected);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        processFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={cn(
        "focus-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
        dragOver ? "border-charcoal bg-porcelain" : "border-sand hover:border-charcoal/40",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          processFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {uploading ? <Loader2 className="h-6 w-6 animate-spin text-stone" /> : <UploadCloud className="h-6 w-6 text-stone" />}
      <p className="text-sm text-charcoal">
        <span className="font-medium underline underline-offset-2">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-stone">JPEG, PNG, WebP, GIF or SVG — up to {MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB each</p>
    </div>
  );
}
