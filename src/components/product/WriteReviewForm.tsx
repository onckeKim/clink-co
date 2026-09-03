"use client";

import * as React from "react";
import { ImagePlus, Star, X } from "lucide-react";
import type { Review } from "@/data/reviews";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";

interface ImageDraft {
  file: File;
  url: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(star)}
          className="focus-ring rounded p-0.5"
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              star <= display ? "fill-champagne-ink text-champagne-ink" : "fill-transparent text-sand",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function WriteReviewForm({
  productSlug,
  productName,
  onSubmit,
  onCancel,
}: {
  productSlug: string;
  productName: string;
  onSubmit: (review: Review) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [verifiedSelfAttested, setVerifiedSelfAttested] = React.useState(false);
  const [images, setImages] = React.useState<ImageDraft[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    // Read as data URLs (not object URLs) so submitted photos survive a
    // page reload once persisted to the reviews store — an object URL is
    // only valid for this tab's lifetime.
    Array.from(fileList)
      .slice(0, 4 - images.length)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setImages((prev) => [...prev, { file, url: reader.result as string }]);
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((image) => image.url !== url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Select a star rating before submitting.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Your review needs at least 10 characters.");
      return;
    }

    onSubmit({
      id: `local-${Date.now()}`,
      customerName: customerName.trim() || "Anonymous",
      location: location.trim() || "South Africa",
      rating,
      title: title.trim() || undefined,
      review: body.trim(),
      productPurchased: productName,
      productSlug,
      verified: verifiedSelfAttested,
      date: new Date().toISOString().slice(0, 10),
      images: images.map((image) => image.url),
      helpfulCount: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-sand p-5">
      <div>
        <Label htmlFor="review-rating">Your rating</Label>
        <div id="review-rating" className="mt-1.5">
          <StarPicker value={rating} onChange={setRating} />
        </div>
      </div>

      <div>
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum it up in a few words"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="review-body">Your review</Label>
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like — or not — about this product?"
          rows={4}
          className="mt-1.5"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="review-name">Your name</Label>
          <Input
            id="review-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Naledi P."
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="review-location">Location (optional)</Label>
          <Input
            id="review-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Cape Town"
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label>Add photos (optional)</Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-sand">
              {/* eslint-disable-next-line @next/next/no-img-element -- a locally-read data URL, not an optimizable remote asset */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(image.url)}
                aria-label="Remove photo"
                className="focus-ring absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal/70 text-warm-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <label className="focus-ring flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-sand text-stone transition-colors hover:border-charcoal/40">
              <ImagePlus className="h-4 w-4" />
              <span className="text-[10px]">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-charcoal">
        <Checkbox checked={verifiedSelfAttested} onCheckedChange={setVerifiedSelfAttested} />
        <span>
          I purchased this product
          <span className="block text-xs text-stone">
            Marks your review as a verified purchase. (Demo only — without an orders table, this is
            self-reported rather than order-verified.)
          </span>
        </span>
      </label>

      {error && <p className="text-xs text-error">{error}</p>}

      <p className="text-xs text-stone">
        Your review is saved to this browser (it&rsquo;ll still be here next visit) and shown below
        immediately — it isn&rsquo;t yet submitted to a shared server, so other visitors won&rsquo;t
        see it.
      </p>

      <div className="flex items-center gap-3">
        <Button type="submit">Submit review</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
