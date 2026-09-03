import type { Product } from "@/types/product";
import { Disclosure } from "@/components/ui/Disclosure";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { formatPrice } from "@/lib/utils";

const DEFAULT_PACKAGING_INFO =
  "Arrives boxed with protective wrapping around each piece. Gift note and gift wrap options are available at checkout.";

export function ProductAccordions({ product }: { product: Product }) {
  const settings = getStoreSettings();
  return (
    <div className="flex flex-col">
      <Disclosure title="Description" defaultOpen>
        <p className="text-sm leading-relaxed text-stone">{product.description}</p>
      </Disclosure>

      <Disclosure title="Specifications">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <SpecRow label="SKU" value={product.sku} />
          <SpecRow label="Category" value={product.productType} />
          {product.material && <SpecRow label="Material" value={product.material} />}
          {product.capacity && <SpecRow label="Capacity" value={product.capacity} />}
          {product.setSize && <SpecRow label="Set size" value={product.setSize} />}
          {product.dimensions && (
            <SpecRow
              label="Dimensions"
              value={`${product.dimensions.heightCm} × ${product.dimensions.widthCm} × ${product.dimensions.depthCm} cm`}
            />
          )}
          {product.weightGrams && <SpecRow label="Weight" value={`${product.weightGrams} g`} />}
        </dl>
      </Disclosure>

      {product.material && (
        <Disclosure title="Material">
          <p className="text-sm leading-relaxed text-stone">{product.material}</p>
        </Disclosure>
      )}

      {product.dimensions && (
        <Disclosure title="Dimensions">
          <dl className="flex flex-col gap-2 text-sm text-stone">
            <div className="flex justify-between">
              <dt>Height</dt>
              <dd>{product.dimensions.heightCm} cm</dd>
            </div>
            <div className="flex justify-between">
              <dt>Width</dt>
              <dd>{product.dimensions.widthCm} cm</dd>
            </div>
            <div className="flex justify-between">
              <dt>Depth</dt>
              <dd>{product.dimensions.depthCm} cm</dd>
            </div>
            {product.weightGrams && (
              <div className="flex justify-between">
                <dt>Weight</dt>
                <dd>{product.weightGrams} g</dd>
              </div>
            )}
          </dl>
        </Disclosure>
      )}

      {product.capacity && (
        <Disclosure title="Capacity">
          <p className="text-sm leading-relaxed text-stone">{product.capacity}</p>
        </Disclosure>
      )}

      <Disclosure title="Care Instructions">
        <ul className="flex flex-col gap-2 text-sm leading-relaxed text-stone">
          {product.careInstructions.map((instruction) => (
            <li key={instruction} className="flex gap-2">
              <span aria-hidden>—</span>
              {instruction}
            </li>
          ))}
        </ul>
      </Disclosure>

      <Disclosure title="Delivery & Returns">
        <ul className="flex flex-col gap-2 text-sm leading-relaxed text-stone">
          <li>Free delivery on orders over {formatPrice(settings.freeDeliveryThreshold)}.</li>
          <li>Use the delivery estimator above for a delivery window specific to your area.</li>
          <li>{settings.returnWindowDays}-day returns on unused items in original packaging.</li>
          <li>Prices include {settings.taxRatePercent}% VAT — no surprises at checkout.</li>
        </ul>
      </Disclosure>

      <Disclosure title="Packaging Information">
        <p className="text-sm leading-relaxed text-stone">{product.packagingInfo ?? DEFAULT_PACKAGING_INFO}</p>
      </Disclosure>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-stone">{label}</dt>
      <dd className="mt-1 text-charcoal">{value}</dd>
    </div>
  );
}
