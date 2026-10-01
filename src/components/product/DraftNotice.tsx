import { EyeOff } from "lucide-react";

/** Shown on the PDP for a product an admin has authored but not yet published — this IS the "preview before publishing" mechanism: the direct link resolves so an admin can review the finished page, but the storefront listing/search never surfaces it and purchasing stays disabled. */
export function DraftNotice({ productName }: { productName: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-champagne/60 bg-champagne/10 p-4">
      <EyeOff className="mt-0.5 h-5 w-5 shrink-0 text-charcoal" aria-hidden />
      <div>
        <p className="text-sm font-medium text-charcoal">This product is a draft</p>
        <p className="mt-1 text-sm text-stone">
          {productName} hasn&apos;t been published yet — it&apos;s only visible via this direct link and
          can&apos;t be purchased. Publish it from the admin dashboard when it&apos;s ready.
        </p>
      </div>
    </div>
  );
}
