"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

function generateVariantId(): string {
  return `var-${Math.random().toString(36).slice(2, 9)}`;
}

/** Colour/style variants (swatch chips on the storefront) — label, optional price delta, and swatch colour. Variant images (per-option gallery override) aren't edited here; a variant falls back to the product's own images, which covers every seed product today. */
export function ProductVariantsEditor({
  variants,
  onChange,
}: {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}) {
  const addVariant = () => {
    onChange([...variants, { id: generateVariantId(), label: "", swatch: "#1c1c1a" }]);
  };

  const updateVariant = (id: string, patch: Partial<ProductVariant>) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      {variants.map((variant) => (
        <div key={variant.id} className="flex flex-wrap items-end gap-3 rounded-2xl border border-sand p-4">
          <div className="min-w-[140px] flex-1">
            <Label htmlFor={`variant-label-${variant.id}`}>Label</Label>
            <Input
              id={`variant-label-${variant.id}`}
              value={variant.label}
              onChange={(e) => updateVariant(variant.id, { label: e.target.value })}
              placeholder="e.g. Smoke"
              className="mt-1.5 h-10"
            />
          </div>
          <div className="w-28">
            <Label htmlFor={`variant-swatch-${variant.id}`}>Swatch</Label>
            <input
              id={`variant-swatch-${variant.id}`}
              type="color"
              value={variant.swatch ?? "#1c1c1a"}
              onChange={(e) => updateVariant(variant.id, { swatch: e.target.value })}
              className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-sand"
            />
          </div>
          <div className="w-32">
            <Label htmlFor={`variant-delta-${variant.id}`}>Price delta</Label>
            <Input
              id={`variant-delta-${variant.id}`}
              type="number"
              inputMode="decimal"
              value={variant.priceDelta ?? ""}
              onChange={(e) =>
                updateVariant(variant.id, { priceDelta: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="0"
              className="mt-1.5 h-10"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeVariant(variant.id)}
            aria-label="Remove variant"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addVariant} className="w-fit">
        <Plus className="h-4 w-4" />
        Add variant
      </Button>
    </div>
  );
}
