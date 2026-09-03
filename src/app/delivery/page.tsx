import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Clock, MapPin, AlertTriangle } from "lucide-react";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { deliveryMethods, PROVINCE_ZONE, ZONE_ADJUSTMENT } from "@/config/delivery";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Delivery Information",
  description: "Delivery areas, processing times, fees and tracking for Clink & Co by HEIMSIGHT orders.",
};

const ZONE_LABELS: Record<keyof typeof ZONE_ADJUSTMENT, { label: string; provinces: string[] }> = {
  metro: { label: "Metro", provinces: [] },
  regional: { label: "Regional", provinces: [] },
  outlying: { label: "Outlying", provinces: [] },
};

for (const [province, zone] of Object.entries(PROVINCE_ZONE)) {
  ZONE_LABELS[zone].provinces.push(province);
}

export default function DeliveryPage() {
  const settings = getStoreSettings();
  const enabledMethods = deliveryMethods.filter((m) => settings.enabledDeliveryMethodIds.includes(m.id));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Delivery Information" }]} className="mb-6" />

      <h1 className="font-display text-display-2xl text-charcoal">Delivery Information</h1>
      <p className="mt-4 text-sm leading-relaxed text-stone">
        Everything you need to know about how we get your order to you — delivery areas, timing, fees and what to do if
        something looks off.
      </p>

      <section className="mt-12">
        <h2 className="font-display flex items-center gap-2 text-display-sm text-charcoal">
          <MapPin className="h-5 w-5 text-stone" />
          Delivery areas
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          We deliver across South Africa. Delivery fees and timing are calculated by zone, based on your delivery
          province:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.entries(ZONE_LABELS) as [keyof typeof ZONE_ADJUSTMENT, (typeof ZONE_LABELS)[keyof typeof ZONE_ADJUSTMENT]][]).map(
            ([zone, { label, provinces }]) => (
              <div key={zone} className="rounded-2xl border border-sand bg-porcelain p-4">
                <p className="text-sm font-semibold text-charcoal">{label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-stone">{provinces.join(", ")}</p>
              </div>
            ),
          )}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-stone">
          Express delivery and local pickup are only available in select metro areas — availability is shown at checkout
          based on your delivery address.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display flex items-center gap-2 text-display-sm text-charcoal">
          <Clock className="h-5 w-5 text-stone" />
          Processing &amp; delivery times
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Orders are typically picked, packed and handed to our courier within <strong className="text-charcoal">1–2 business days</strong> of
          payment being confirmed. From there, delivery timing depends on the method you choose and your delivery zone:
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-sand text-xs uppercase tracking-wide text-stone">
                <th className="py-2 pr-4 font-medium">Method</th>
                <th className="py-2 pr-4 font-medium">Estimated delivery</th>
                <th className="py-2 font-medium">Base fee</th>
              </tr>
            </thead>
            <tbody>
              {enabledMethods.map((method) => (
                <tr key={method.id} className="border-b border-sand/60">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-charcoal">{method.label}</p>
                    <p className="text-xs text-stone">{method.description}</p>
                  </td>
                  <td className="py-3 pr-4 text-stone">
                    {method.minDays === method.maxDays ? `${method.minDays}` : `${method.minDays}–${method.maxDays}`} business
                    days from dispatch
                  </td>
                  <td className="py-3 text-stone">{method.baseFee === 0 ? "Free" : `From ${formatPrice(method.baseFee)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-stone">
          Fees shown are for the metro zone; regional and outlying areas carry a small zone adjustment, calculated
          automatically at checkout once you enter your delivery address.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-display-sm text-charcoal">Delivery fees &amp; free delivery</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Delivery fees are calculated at checkout based on your chosen method and delivery zone. Orders over{" "}
          <strong className="text-charcoal">{formatPrice(settings.freeDeliveryThreshold)}</strong> qualify for free
          standard delivery, automatically applied at checkout — no code needed.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display flex items-center gap-2 text-display-sm text-charcoal">
          <Truck className="h-5 w-5 text-stone" />
          Tracking your order
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Once your order ships, we&apos;ll email you tracking details for your courier. You can also check your
          order&apos;s status any time from{" "}
          <Link href="/account/orders" className="link-underline text-charcoal">
            your account
          </Link>
          .
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-sand bg-porcelain p-6">
        <h2 className="font-display flex items-center gap-2 text-display-sm text-charcoal">
          <AlertTriangle className="h-5 w-5 text-stone" />
          Delays, addresses &amp; damaged parcels
        </h2>
        <div className="mt-4 flex flex-col gap-5">
          <div>
            <h3 className="text-sm font-semibold text-charcoal">Delays</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-stone">
              Estimated delivery times are our best guide, not a guarantee — courier delays, load-shedding and weather
              can occasionally push delivery beyond the estimated window. If your order is running significantly late,{" "}
              <Link href="/contact?category=Delivery%20%26%20Tracking" className="link-underline text-charcoal">
                get in touch
              </Link>{" "}
              and we&apos;ll chase it up with the courier on your behalf.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-charcoal">Incorrect delivery addresses</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-stone">
              Please double-check your delivery address before placing your order — we dispatch to the address given
              at checkout. If you spot an error, contact us immediately; we can usually amend an address before an
              order is packed, but can&apos;t guarantee a change once it&apos;s with the courier. Re-delivery to a
              corrected address after a failed delivery may incur an additional fee.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-charcoal">Damaged parcels</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-stone">
              If a parcel arrives visibly damaged, please note this with the courier on delivery where possible and
              contact us within 48 hours with photos of the packaging and item. We&apos;ll arrange a replacement or
              refund at no cost to you — see our{" "}
              <Link href="/returns" className="link-underline text-charcoal">
                Returns page
              </Link>{" "}
              for the full process.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
