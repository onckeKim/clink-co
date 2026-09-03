"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { toast } from "@/components/ui/Toast";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Single-image upload (category tile, collection cover, hero slide, banner) — uploads through the media library (POST /api/admin/media), same as ProductImagesEditor, but for the many admin surfaces that only ever need one image. */
export function SingleImageUploader({
  value,
  onChange,
  folder,
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
}) {
  const [uploading, setUploading] = React.useState(false);

  const handleFiles = async ([file]: File[]) => {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, filename: file.name, mimeType: file.type, sizeBytes: file.size, folder }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't upload that image.");
        return;
      }
      onChange(data.media.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="relative w-40 overflow-hidden rounded-2xl border border-sand">
          <div className="relative aspect-square bg-sand/30">
            <Image src={value} alt="" fill sizes="160px" className="object-cover" unoptimized={value.startsWith("data:")} />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="focus-ring absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-charcoal/70 text-warm-white hover:bg-error/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <ImageUploader
          onFiles={handleFiles}
          onReject={(rejected) => rejected.forEach((r) => toast.error(`${r.file.name}: ${r.reason}`))}
          multiple={false}
          uploading={uploading}
        />
      )}
      {uploading && (
        <p className="flex items-center gap-1.5 text-xs text-stone">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
        </p>
      )}
    </div>
  );
}
