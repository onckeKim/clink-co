"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Loader2, Star, X } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Multi-image upload + reorder + "set as featured" for the product form.
 * `images[0]` is the featured image everywhere it's read across the
 * storefront (ProductCard, PDP gallery, JSON-LD, cart lines) — there's no
 * separate `featuredImage` field — so "set featured" just moves an image to
 * the front. Uploads go through the media library (POST /api/admin/media)
 * so every product image is also catalogued there, then the returned URL
 * (a data: URI in this dev/demo environment) is what's stored on the
 * product record.
 */
export function ProductImagesEditor({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = React.useState(false);

  const handleFiles = async (files: File[]) => {
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const dataUrl = await fileToDataUrl(file);
        const res = await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl,
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            folder: "products",
            labels: ["product-photography"],
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error ?? `Couldn't upload ${file.name}.`);
          continue;
        }
        const data: { media: { url: string } } = await res.json();
        uploaded.push(data.media.url);
      }
    } finally {
      setUploading(false);
    }
    if (uploaded.length) onChange([...images, ...uploaded]);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  const setFeatured = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [chosen] = next.splice(index, 1);
    next.unshift(chosen!);
    onChange(next);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, i) => (
            <div key={image + i} className="group relative overflow-hidden rounded-2xl border border-sand">
              <div className="relative aspect-square bg-sand/30">
                <Image src={image} alt="" fill sizes="200px" className="object-cover" unoptimized={image.startsWith("data:")} />
              </div>
              {i === 0 && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-charcoal px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warm-white">
                  <Star className="h-3 w-3 fill-current" /> Featured
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-charcoal/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    aria-label="Move image earlier"
                    className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-warm-white transition-colors hover:bg-warm-white/20 disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === images.length - 1}
                    aria-label="Move image later"
                    className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-warm-white transition-colors hover:bg-warm-white/20 disabled:opacity-30"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => setFeatured(i)}
                      aria-label="Set as featured image"
                      className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-warm-white transition-colors hover:bg-warm-white/20"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="Remove image"
                  className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-warm-white transition-colors hover:bg-error/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageUploader
        onFiles={handleFiles}
        onReject={(rejected) => rejected.forEach((r) => toast.error(`${r.file.name}: ${r.reason}`))}
        uploading={uploading}
        className={cn(images.length === 0 && "py-12")}
      />
      {uploading && (
        <p className="flex items-center gap-1.5 text-xs text-stone">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
        </p>
      )}
    </div>
  );
}
