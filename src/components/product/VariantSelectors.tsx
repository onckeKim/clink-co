import type { ProductOption, ProductVariant } from "@/types/product";
import { cn, formatPrice } from "@/lib/utils";

export function ColorSelector({
  variants,
  selectedId,
  onChange,
}: {
  variants: ProductVariant[];
  selectedId: string | undefined;
  onChange: (id: string) => void;
}) {
  const selected = variants.find((v) => v.id === selectedId);

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone">
        Colour{selected ? `: ${selected.label}` : ""}
      </p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            role="radio"
            aria-checked={selectedId === variant.id}
            onClick={() => onChange(variant.id)}
            aria-label={variant.label}
            title={variant.label}
            className={cn(
              "focus-ring flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
              selectedId === variant.id ? "border-charcoal" : "border-transparent",
            )}
          >
            <span
              className="h-7 w-7 rounded-full border border-charcoal/15"
              style={{ backgroundColor: variant.swatch }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SetSizeSelector({
  options,
  selectedId,
  onChange,
}: {
  options: ProductOption[];
  selectedId: string | undefined;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone">Set size</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Set size">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selectedId === option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "focus-ring rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              selectedId === option.id
                ? "border-charcoal bg-charcoal text-warm-white"
                : "border-sand text-charcoal hover:border-charcoal/40",
            )}
          >
            {option.label}
            {option.priceDelta ? (
              <span className="ml-1 text-xs opacity-70">
                ({option.priceDelta > 0 ? "+" : ""}
                {formatPrice(option.priceDelta)})
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
